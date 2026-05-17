// STAGE 17 — QualityPanel container: VM wiring + Redux connect

import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {
    setFindings, setLLMLoading, setSuggestions,
    getFindings, getLLMLoading, getSuggestions,
} from '../reducers/quality-panel.js';
import QualityPanelComponent from '../components/quality-panel/quality-panel.jsx';

class QualityPanel extends React.Component {
    constructor (props) {
        super(props);
        this.listener = null;
        this.unsubscribe = null;
        this._vm = null;
        this.handleFindingsUpdate = this.handleFindingsUpdate.bind(this);
        this.handleProjectLoaded = this.handleProjectLoaded.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
    }

    componentDidMount () {
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
        // Lazy-load WorkspaceListener to avoid bloating the initial bundle
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
    }

    handleDescriptionChange (description) {
        if (this.listener) {
            this.listener.updateConfig({projectDescription: description || undefined});
            this.listener.triggerAnalysis();
        }
    }

    render () {
        return (
            <QualityPanelComponent
                findings={this.props.findings}
                suggestions={this.props.suggestions}
                llmLoading={this.props.llmLoading}
                onDescriptionChange={this.handleDescriptionChange}
            />
        );
    }
}

QualityPanel.propTypes = {
    vm: PropTypes.object,
    findings: PropTypes.array.isRequired,
    suggestions: PropTypes.array.isRequired,
    llmLoading: PropTypes.bool.isRequired,
    onSetFindings: PropTypes.func.isRequired,
    onSetSuggestions: PropTypes.func.isRequired,
    onSetLLMLoading: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    findings: getFindings(state),
    suggestions: getSuggestions(state),
    llmLoading: getLLMLoading(state),
});

const mapDispatchToProps = dispatch => ({
    onSetFindings: findings => dispatch(setFindings(findings)),
    onSetSuggestions: suggestions => dispatch(setSuggestions(suggestions)),
    onSetLLMLoading: loading => dispatch(setLLMLoading(loading)),
});

export default connect(mapStateToProps, mapDispatchToProps)(QualityPanel);
