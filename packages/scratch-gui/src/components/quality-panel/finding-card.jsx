import React from 'react';
import PropTypes from 'prop-types';
import styles from './quality-panel.css';

const FindingCard = ({finding, count}) => {
    const sourceBadgeLabel = finding.source === 'llm' ? 'AI' : 'RULE';
    const sourceBadgeTitle = finding.source === 'llm'
        ? 'Detected by AI'
        : 'Detected by static analysis';

    return (
        <li className={`${styles['finding-card']} ${styles[finding.severity]}`}>
            <div className={styles['finding-body']}>
                <div className={styles['finding-meta']}>
                    <span className={styles['finding-sprite']}>{finding.sprite}</span>
                    <div className={styles['finding-badges']}>
                        {count > 1 && (
                            <span className={styles['finding-count']}>{`×${count}`}</span>
                        )}
                        <span
                            className={`${styles['finding-source-badge']} ${styles[finding.source]}`}
                            aria-label={sourceBadgeTitle}
                            title={sourceBadgeTitle}
                        >
                            {sourceBadgeLabel}
                        </span>
                    </div>
                </div>
                {finding.title && (
                    <p className={styles['finding-title']}>{finding.title}</p>
                )}
                <p className={styles['finding-description']}>{finding.description}</p>
                {finding.fix && (
                    <p className={styles['finding-fix']}>{finding.fix}</p>
                )}
            </div>
        </li>
    );
};

FindingCard.propTypes = {
    finding: PropTypes.shape({
        dimension: PropTypes.string.isRequired,
        severity: PropTypes.oneOf(['error', 'warning', 'info']).isRequired,
        source: PropTypes.oneOf(['rule-based', 'llm']).isRequired,
        sprite: PropTypes.string.isRequired,
        title: PropTypes.string,
        description: PropTypes.string.isRequired,
        fix: PropTypes.string,
    }).isRequired,
    count: PropTypes.number.isRequired,
};

export default FindingCard;
