'use client';

import { Modal } from './Modal';

interface BrandPickerModalProps {
    baseUrl: string | null;
    onClose: () => void;
}

export function BrandPickerModal({ baseUrl, onClose }: BrandPickerModalProps) {
    function download(brand: 'liderplast' | 'swimming') {
        if (!baseUrl) return;
        window.location.href = `${baseUrl}?brand=${brand}`;
        onClose();
    }

    return (
        <Modal open={!!baseUrl} onClose={onClose} title="Seleccionar marca" size="sm">
            <p className="text-sm text-gray-500 mb-4">Elegí el logo para el documento:</p>
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => download('liderplast')}
                    className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all group"
                >
                    <img
                        src="/logo-institutional.png"
                        alt="Liderplast"
                        className="h-14 object-contain"
                    />
                    <span className="text-sm font-bold text-gray-700 group-hover:text-primary-700">Liderplast</span>
                </button>
                <button
                    onClick={() => download('swimming')}
                    className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all group"
                >
                    <img
                        src="/logo-swimming-pool.svg"
                        alt="Swimming Pool"
                        className="h-14 object-contain"
                    />
                    <span className="text-sm font-bold text-gray-700 group-hover:text-primary-700">Swimming Pool</span>
                </button>
            </div>
        </Modal>
    );
}
