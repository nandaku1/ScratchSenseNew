// STAGE 17 — QualityPanel container: VM wiring + Redux connect

import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {
    setFindings, setLLMLoading, setSuggestions,
    getFindings, getLLMLoading, getSuggestions,
    setParticipantId, appendSessionLog, clearSessionLog,
    getParticipantId, getSessionLog,
} from '../reducers/quality-panel.js';
import QualityPanelComponent from '../components/quality-panel/quality-panel.jsx';

const LS_PARTICIPANT_KEY = 'scratchsense_participant_id';

class QualityPanel extends React.Component {
    constructor (props) {
        super(props);
        this.listener = null;
        this.unsubscribe = null;
        this._vm = null;
        this.sessionStartTime = Date.now();
        this.timerInterval = null;
        this.state = {sessionDuration: '00:00'};
        this.handleFindingsUpdate = this.handleFindingsUpdate.bind(this);
        this.handleProjectLoaded = this.handleProjectLoaded.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
        this.handleParticipantIdChange = this.handleParticipantIdChange.bind(this);
        this.handleExportLog = this.handleExportLog.bind(this);
        this.handleResetSession = this.handleResetSession.bind(this);
    }

    componentDidMount () {
        const savedId = localStorage.getItem(LS_PARTICIPANT_KEY) || '';
        if (savedId) this.props.onSetParticipantId(savedId);
        if (this.props.vm) {
            this.attachListener(this.props.vm);
        }
    }

    componentDidUpdate (prevProps) {
        if (prevProps.vm !== this.props.vm) {
            this.detachListener();
            if (this.props.vm) {
                this.attachListener(this.props.vm);
            }
        }
    }

    componentWillUnmount () {
        this.detachListener();
    }

    attachListener (vm) {
        this._vm = vm;
        import('@scratch/scratch-quality-panel').then(({WorkspaceListener}) => {
            this.listener = new WorkspaceListener({
                anthropicApiKey: process.env.ANTHROPIC_API_KEY || undefined,
                debounceMs: 2000,
            });
            this.unsubscribe = this.listener.onFindingsUpdate(this.handleFindingsUpdate);
            this.listener.attach(vm);
            if (process.env.ANTHROPIC_API_KEY) {
                this.props.onSetLLMLoading(true);
            }
            this.sessionStartTime = Date.now();
            this.startTimer();
            this.listener.triggerAnalysis();
            vm.on('PROJECT_LOADED', this.handleProjectLoaded);
        });
    }

    detachListener () {
        if (this._vm) {
            this._vm.removeListener('PROJECT_LOADED', this.handleProjectLoaded);
            this._vm = null;
        }
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        if (this.listener) {
            this.listener.detach();
            this.listener = null;
        }
        this.stopTimer();
    }

    startTimer () {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.sessionStartTime;
            const totalSec = Math.floor(elapsed / 1000);
            const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
            const ss = String(totalSec % 60).padStart(2, '0');
            this.setState({sessionDuration: `${mm}:${ss}`});
        }, 1000);
    }

    stopTimer () {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    handleProjectLoaded () {
        if (this.listener) {
            this.listener.triggerAnalysis();
        }
    }

    handleFindingsUpdate (findings, suggestions, llmDone = false) {
        this.props.onSetFindings(findings);
        this.props.onSetSuggestions(suggestions);
        const loading = Boolean(process.env.ANTHROPIC_API_KEY) && !llmDone;
        this.props.onSetLLMLoading(loading);
        this.props.onAppendSessionLog({
            timestamp_ms: Date.now() - this.sessionStartTime,
            wall_clock: new Date().toISOString(),
            trigger: llmDone ? 'llm' : 'rule-based',
            findings,
        });
    }

    handleDescriptionChange (description) {
        if (this.listener) {
            this.listener.updateConfig({projectDescription: description || undefined});
            this.listener.triggerAnalysis();
        }
    }

    handleParticipantIdChange (id) {
        this.props.onSetParticipantId(id);
        if (id) {
            localStorage.setItem(LS_PARTICIPANT_KEY, id);
        } else {
            localStorage.removeItem(LS_PARTICIPANT_KEY);
        }
    }

    handleExportLog () {
        const {participantId, sessionLog} = this.props;
        const id = participantId || 'UNKNOWN';
        const data = {
            participant_id: participantId || 'UNKNOWN',
            session_start: new Date(this.sessionStartTime).toISOString(),
            exported_at: new Date().toISOString(),
            total_dispatches: sessionLog.length,
            log: sessionLog,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `findings_log_${id}_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    handleResetSession () {
        if (!window.confirm(
            'Reset session? This will clear all findings and the session log. Make sure you have exported the log first.'
        )) return;
        this.props.onSetFindings([]);
        this.props.onSetSuggestions([]);
        this.props.onClearSessionLog();
        this.props.onSetParticipantId('');
        localStorage.removeItem(LS_PARTICIPANT_KEY);
        this.sessionStartTime = Date.now();
        this.setState({sessionDuration: '00:00'});
        this.startTimer();
    }

    render () {
        return (
            <QualityPanelComponent
                findings={this.props.findings}
                suggestions={this.props.suggestions}
                llmLoading={this.props.llmLoading}
                participantId={this.props.participantId}
                sessionLog={this.props.sessionLog}
                sessionDuration={this.state.sessionDuration}
                onDescriptionChange={this.handleDescriptionChange}
                onParticipantIdChange={this.handleParticipantIdChange}
                onExportLog={this.handleExportLog}
                onResetSession={this.handleResetSession}
            />
        );
    }
}

QualityPanel.propTypes = {
    vm: PropTypes.object,
    findings: PropTypes.array.isRequired,
    suggestions: PropTypes.array.isRequired,
    llmLoading: PropTypes.bool.isRequired,
    participantId: PropTypes.string.isRequired,
    sessionLog: PropTypes.array.isRequired,
    onSetFindings: PropTypes.func.isRequired,
    onSetSuggestions: PropTypes.func.isRequired,
    onSetLLMLoading: PropTypes.func.isRequired,
    onSetParticipantId: PropTypes.func.isRequired,
    onAppendSessionLog: PropTypes.func.isRequired,
    onClearSessionLog: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    findings: getFindings(state),
    suggestions: getSuggestions(state),
    llmLoading: getLLMLoading(state),
    participantId: getParticipantId(state),
    sessionLog: getSessionLog(state),
});

const mapDispatchToProps = dispatch => ({
    onSetFindings: findings => dispatch(setFindings(findings)),
    onSetSuggestions: suggestions => dispatch(setSuggestions(suggestions)),
    onSetLLMLoading: loading => dispatch(setLLMLoading(loading)),
    onSetParticipantId: id => dispatch(setParticipantId(id)),
    onAppendSessionLog: entry => dispatch(appendSessionLog(entry)),
    onClearSessionLog: () => dispatch(clearSessionLog()),
});

export default connect(mapStateToProps, mapDispatchToProps)(QualityPanel);
