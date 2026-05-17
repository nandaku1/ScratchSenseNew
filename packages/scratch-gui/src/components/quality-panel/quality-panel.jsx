// STAGE 19 — QualityPanel UI component: dimension filters, API key bar, findings list

import React, {useState, useRef, useEffect} from 'react';
import PropTypes from 'prop-types';
import FindingCard from './finding-card.jsx';
import styles from './quality-panel.css';

const DIMENSIONS = ['correctness', 'performance', 'maintainability'];
const DIMENSION_ICONS = {
    correctness: '🔴',
    performance: '🟡',
    maintainability: '🔵',
};

const QualityPanel = ({
    findings,
    suggestions,
    llmLoading,
    participantId,
    sessionLog,
    sessionDuration,
    onDescriptionChange,
    onParticipantIdChange,
    onExportLog,
    onResetSession,
}) => {
    const [activeDimension, setActiveDimension] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [description, setDescription] = useState('');
    const textareaRef = useRef(null);

    useEffect(() => {
        if (showDialog && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [showDialog]);

    const errorCount = findings.filter(f => f.severity === 'error').length;

    const badgeAriaLabel = `${findings.length} finding${findings.length !== 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} error${errorCount > 1 ? 's' : ''}` : ''}`;

    const handleDimensionClick = dim => {
        setActiveDimension(prev => (prev === dim ? null : dim));
    };

    const handleToggleDialog = () => setShowDialog(prev => !prev);

    const handleDescriptionInput = e => {
        const val = e.target.value;
        setDescription(val);
        if (onDescriptionChange) onDescriptionChange(val.trim());
    };

    const handleDialogKeyDown = e => {
        if (e.key === 'Escape') setShowDialog(false);
    };

    const filtered = activeDimension
        ? findings.filter(f => f.dimension === activeDimension)
        : findings;

    const grouped = DIMENSIONS.reduce((acc, dim) => {
        const dimFindings = filtered.filter(f => f.dimension === dim);
        const seen = new Map();
        dimFindings.forEach(f => {
            const key = `${f.severity}|${f.source}|${f.description}`;
            if (seen.has(key)) {
                seen.get(key).count += 1;
            } else {
                seen.set(key, {...f, count: 1});
            }
        });
        acc[dim] = Array.from(seen.values());
        return acc;
    }, {});

    const dimCount = dim => findings.filter(f => f.dimension === dim).length;

    return (
        <section
            className={styles['quality-panel']}
            aria-label="ScratchSense quality analysis"
        >
            {/* Header */}
            <div className={styles['panel-header']}>
                <span className={styles['panel-title']}>ScratchSense</span>
                <div className={styles['header-actions']}>
                    <span className={styles['session-timer']}>{sessionDuration}</span>
                    <div className={styles['describe-btn-wrapper']}>
                        <button
                            className={`${styles['describe-btn']}${description ? ` ${styles['describe-btn-active']}` : ''}`}
                            onClick={handleToggleDialog}
                            aria-label="Add project description for AI analysis"
                            aria-expanded={showDialog}
                        >
                            {'✏ Describe'}
                        </button>
                        <span className={styles['describe-tooltip']}>
                            {description
                                ? `Current: "${description}"`
                                : 'Tell the AI what your project is about for more specific feedback'}
                        </span>
                    </div>
                    <span
                        className={`${styles['badge-count']}${errorCount > 0 ? ` ${styles['has-errors']}` : ''}`}
                        aria-label={badgeAriaLabel}
                    >
                        {findings.length}
                    </span>
                </div>
            </div>

            {/* Participant ID bar */}
            <div className={styles['participant-id-bar']}>
                <span className={styles['participant-id-label']}>{'PID'}</span>
                <input
                    className={styles['participant-id-input']}
                    type="text"
                    value={participantId}
                    onChange={e => onParticipantIdChange(e.target.value)}
                    placeholder="P01"
                    spellCheck={false}
                    autoComplete="off"
                />
            </div>

            {/* Researcher toolbar — only visible once session log has entries */}
            {sessionLog.length > 0 && (
                <div className={styles['researcher-toolbar']}>
                    <button
                        className={styles['researcher-btn']}
                        onClick={onExportLog}
                    >
                        {'Export log'}
                    </button>
                    <button
                        className={`${styles['researcher-btn']} ${styles['researcher-btn-danger']}`}
                        onClick={onResetSession}
                    >
                        {'Reset session'}
                    </button>
                </div>
            )}

            {/* Description dialog */}
            {showDialog && (
                <div
                    className={styles['description-dialog']}
                    role="dialog"
                    aria-label="Project description"
                    onKeyDown={handleDialogKeyDown}
                >
                    <p className={styles['description-dialog-label']}>
                        {'Describe your project so the AI can give more specific advice:'}
                    </p>
                    <textarea
                        ref={textareaRef}
                        className={styles['description-textarea']}
                        value={description}
                        onChange={handleDescriptionInput}
                        placeholder={'e.g. "a platformer where the player collects coins and avoids enemies"'}
                        rows={5}
                    />
                </div>
            )}

            {/* Dimension filter chips */}
            <div className={styles['summary-bar']}>
                {DIMENSIONS.map(dim => (
                    <button
                        key={dim}
                        className={`${styles['summary-chip']} ${styles[dim]}${activeDimension === dim ? ` ${styles.active}` : ''}`}
                        aria-pressed={activeDimension === dim}
                        onClick={() => handleDimensionClick(dim)}
                        title={dim}
                    >
                        {DIMENSION_ICONS[dim]} {dimCount(dim)}
                    </button>
                ))}
            </div>

            {/* LLM loading status — always in DOM so aria-live can announce changes */}
            <div
                aria-live="polite"
                aria-atomic="true"
                className={styles['llm-loading-region']}
            >
                {llmLoading && (
                    <div className={styles['llm-loading']}>
                        <div className={styles['llm-loading-dot']} />
                        <span>{'AI analysis running…'}</span>
                    </div>
                )}
            </div>

            {/* Researcher reminder banner — shown until participant ID is entered */}
            {!participantId && (
                <div className={styles['session-banner']}>
                    {'Enter a participant ID above before starting the session.'}
                </div>
            )}

            {/* Findings list */}
            <ul className={styles['findings-list']}>
                {filtered.length === 0 && suggestions.length === 0 ? (
                    <li className={styles['findings-empty']}>
                        <span>{'No issues found'}</span>
                    </li>
                ) : (
                    <>
                        {DIMENSIONS.map(dim => (
                            grouped[dim].length > 0 && (
                                <li
                                    key={dim}
                                    className={styles['dimension-group']}
                                >
                                    <h3 className={styles['dimension-heading']}>
                                        {DIMENSION_ICONS[dim]} {dim}
                                    </h3>
                                    <ul className={styles['dimension-findings']}>
                                        {grouped[dim].map((finding, i) => (
                                            <FindingCard
                                                key={i}
                                                finding={finding}
                                                count={finding.count}
                                            />
                                        ))}
                                    </ul>
                                </li>
                            )
                        ))}

                        {suggestions.length > 0 && (
                            <li className={styles['dimension-group']}>
                                <h3 className={styles['dimension-heading']}>
                                    {'💡 suggestions'}
                                </h3>
                                <ul className={styles['dimension-findings']}>
                                    {suggestions.map((s, i) => (
                                        <li
                                            key={i}
                                            className={styles['suggestion-card']}
                                        >
                                            <div className={styles['finding-body']}>
                                                {s.title && (
                                                    <p className={styles['finding-title']}>{s.title}</p>
                                                )}
                                                <p className={styles['finding-description']}>{s.description}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        )}
                    </>
                )}
            </ul>
        </section>
    );
};

QualityPanel.propTypes = {
    findings: PropTypes.array.isRequired,
    suggestions: PropTypes.array.isRequired,
    llmLoading: PropTypes.bool.isRequired,
    participantId: PropTypes.string.isRequired,
    sessionLog: PropTypes.array.isRequired,
    sessionDuration: PropTypes.string.isRequired,
    onDescriptionChange: PropTypes.func,
    onParticipantIdChange: PropTypes.func.isRequired,
    onExportLog: PropTypes.func.isRequired,
    onResetSession: PropTypes.func.isRequired,
};

QualityPanel.defaultProps = {
    onDescriptionChange: null,
};

export default QualityPanel;
