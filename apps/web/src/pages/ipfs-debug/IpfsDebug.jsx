import { useState } from 'react';
import styles from './IpfsDebug.module.css';
import { uploadCourseMetadata } from '../../utils/ipfsApi';

const DEFAULT_FORM = {
    title: '',
    description: '',
    image: '',
    ownerWalletAddress: '',
    price: '0',
    token: 'MATIC',
};

function IpfsDebug() {
    const [form, setForm] = useState(DEFAULT_FORM);
    const [status, setStatus] = useState('');
    const [cid, setCid] = useState('');
    const [ipfsUrl, setIpfsUrl] = useState('');

    const setField = (field) => (event) => {
        setForm((prev) => ({
            ...prev,
            [field]: event.target.value,
        }));
    };

    const onUpload = async () => {
        setStatus('Uploading metadata to IPFS...');
        setCid('');
        setIpfsUrl('');

        try {
            const payload = await uploadCourseMetadata({
                course: {
                    title: form.title,
                    description: form.description,
                    thumbnailUrl: form.image,
                    price: Number(form.price || 0),
                    token: form.token,
                    ownerWalletAddress: form.ownerWalletAddress,
                },
                profile: {
                    walletAddress: form.ownerWalletAddress,
                },
            });

            setCid(payload?.cid || '');
            setIpfsUrl(payload?.ipfsUrl || '');
            setStatus('Upload complete.');
        } catch (error) {
            setStatus(
                error instanceof Error ? error.message : 'Upload failed.',
            );
        }
    };

    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <h1>IPFS Debug Uploader</h1>
                <p>Uploads minimal course metadata JSON to Pinata IPFS.</p>

                <div className={styles.formGrid}>
                    <label htmlFor='title'>Title</label>
                    <input id='title' value={form.title} onChange={setField('title')} />

                    <label htmlFor='description'>Description</label>
                    <textarea
                        id='description'
                        value={form.description}
                        onChange={setField('description')}
                    />

                    <label htmlFor='image'>Image URL</label>
                    <input id='image' value={form.image} onChange={setField('image')} />

                    <label htmlFor='wallet'>Owner Wallet</label>
                    <input
                        id='wallet'
                        value={form.ownerWalletAddress}
                        onChange={setField('ownerWalletAddress')}
                    />

                    <label htmlFor='price'>Price</label>
                    <input id='price' value={form.price} onChange={setField('price')} />

                    <label htmlFor='token'>Token</label>
                    <input id='token' value={form.token} onChange={setField('token')} />
                </div>

                <button type='button' className={styles.primaryButton} onClick={onUpload}>
                    Upload Metadata
                </button>

                {status ? <p className={styles.status}>{status}</p> : null}

                {cid ? (
                    <div className={styles.resultBox}>
                        <p><strong>CID:</strong> {cid}</p>
                        {ipfsUrl ? (
                            <a href={ipfsUrl} target='_blank' rel='noreferrer'>
                                Open Gateway Link
                            </a>
                        ) : null}
                    </div>
                ) : null}
            </section>
        </main>
    );
}

export default IpfsDebug;
