import styles from '../CreateCourse.module.css';
import { TOKEN_OPTIONS } from '../createCourseConstants';

function PricingStep({ draft, errors, finalPrice, onFieldChange }) {
    return (
        <section className={styles.stepPanel}>
            <h2>Pricing</h2>
            <p>Set your selling price and discount strategy for launch.</p>

            <div className={styles.formGrid}>
                <label className={styles.field} htmlFor='course-price'>
                    Base Price *
                    <input
                        id='course-price'
                        type='number'
                        min='0'
                        step='0.01'
                        value={draft.price}
                        className={errors.price ? styles.invalidInput : ''}
                        onChange={(event) =>
                            onFieldChange('price', event.target.value)
                        }
                    />
                    {errors.price ? (
                        <span className={styles.errorText}>{errors.price}</span>
                    ) : null}
                </label>

                <label className={styles.field} htmlFor='course-discount'>
                    Launch Discount (%)
                    <input
                        id='course-discount'
                        type='number'
                        min='0'
                        max='90'
                        step='1'
                        value={draft.discount}
                        className={errors.discount ? styles.invalidInput : ''}
                        onChange={(event) =>
                            onFieldChange('discount', event.target.value)
                        }
                    />
                    {errors.discount ? (
                        <span className={styles.errorText}>{errors.discount}</span>
                    ) : null}
                </label>

                <label className={styles.field} htmlFor='course-token'>
                    Payment Token
                    <select
                        id='course-token'
                        value={draft.token}
                        onChange={(event) =>
                            onFieldChange('token', event.target.value)
                        }
                    >
                        {TOKEN_OPTIONS.map((tokenOption) => (
                            <option key={tokenOption} value={tokenOption}>
                                {tokenOption}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <aside className={styles.pricingPreview}>
                <h3>Pricing Preview</h3>
                <p>
                    Base Price: {Number.parseFloat(draft.price || '0').toFixed(2)}{' '}
                    {draft.token}
                </p>
                <p>Discount: {draft.discount || 0}%</p>
                <p className={styles.finalPrice}>
                    Final Price: {finalPrice.toFixed(2)} {draft.token}
                </p>
            </aside>
        </section>
    );
}

export default PricingStep;
