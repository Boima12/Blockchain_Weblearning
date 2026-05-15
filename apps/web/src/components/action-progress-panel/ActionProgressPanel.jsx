import styles from './ActionProgressPanel.module.css';

const getStepStateClass = (state) => {
    if (state === 'done') return styles.stepDone;
    if (state === 'active') return styles.stepActive;
    if (state === 'error') return styles.stepError;
    return styles.stepPending;
};

function ActionProgressPanel({
    title,
    description,
    currentStage,
    steps = [],
    txHash = '',
    tone = 'info',
}) {
    if (!title) {
        return null;
    }

    const currentIndex = steps.findIndex((step) => step.id === currentStage);
    const flowSucceeded = tone === 'success';
    const currentStageLabel = flowSucceeded
        ? 'Complete'
        : (steps.find((step) => step.id === currentStage)?.label ??
          String(currentStage ?? 'processing')
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (letter) => letter.toUpperCase()));

    return (
        <section className={`${styles.panel} ${styles[tone] ?? styles.info}`} aria-live="polite">
            <div className={styles.headerRow}>
                <div>
                    <p className={styles.kicker}>Progress</p>
                    <h3>{title}</h3>
                </div>
                <span className={styles.stageBadge}>{currentStageLabel}</span>
            </div>

            {description ? <p className={styles.description}>{description}</p> : null}

            <ol className={styles.stepList}>
                {steps.map((step, index) => {
                    let stepState;
                    if (flowSucceeded) {
                        stepState = 'done';
                    } else if (step.id === currentStage) {
                        stepState = tone === 'error' ? 'error' : 'active';
                    } else if (currentIndex >= 0 && index < currentIndex) {
                        stepState = 'done';
                    } else if (currentIndex >= 0 && index > currentIndex) {
                        stepState = 'pending';
                    } else {
                        stepState = step.state ?? 'pending';
                    }

                    return (
                        <li key={step.id} className={`${styles.stepItem} ${getStepStateClass(stepState)}`}>
                            <span className={styles.stepDot} />
                            <div>
                                <p>{step.label}</p>
                                {step.hint ? <small>{step.hint}</small> : null}
                            </div>
                        </li>
                    );
                })}
            </ol>

            {txHash ? (
                <div className={styles.txBox}>
                    <p>Transaction Hash</p>
                    <code>{txHash}</code>
                </div>
            ) : null}
        </section>
    );
}

export default ActionProgressPanel;
