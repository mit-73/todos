import React, { useCallback } from 'react';
import { X, Sun, Moon, Monitor, ChevronDown, LoaderCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

const SettingsModal = ({
    show,
    onClose,
    locale,
    setLocale,
    nsfwTags,
    setNsfwTags,
    theme,
    setTheme,
    weekStart,
    setWeekStart,
    onClearDatabase,
    onExport,
    onImport,
    onSave
}) => {

    if (!show) return null;

    function ImportDropzone() {
        const onDrop = useCallback((acceptedFiles) => {
            acceptedFiles.forEach((file) => {
                const reader = new FileReader()

                reader.onabort = () => console.log('file reading was aborted')
                reader.onerror = () => console.log('file reading has failed')
                reader.onload = () => {
                    const binaryStr = reader.result
                    onImport(binaryStr)
                }
                reader.readAsArrayBuffer(file)
            })

        }, [])
        const { getRootProps, getInputProps } = useDropzone({ onDrop })

        return (
            <div {...getRootProps()} className="mt-4 p-4 border-2 border-dashed border-light-text/20 dark:border-dark-text/20 rounded-xl text-center cursor-pointer hover:border-light-primary dark:hover:border-dark-primary transition-colors">
                <input {...getInputProps()} />
                <p className="text-light-text-muted dark:text-dark-text-muted">Drag 'n' drop backup file here, or click to select</p>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Settings</h3>
                        <button
                            onClick={onClose}
                            className="text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Locale Setting */}
                        <div>
                            <label className="block font-medium mb-2">
                                Language & Region
                            </label>
                            <div className="relative">
                                <select
                                    value={locale}
                                    onChange={(e) => setLocale(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-light-bg dark:bg-dark-bg shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none appearance-none pr-10"
                                >
                                    <option value="en-US">English (United States)</option>
                                    <option value="en-GB">English (United Kingdom)</option>
                                    <option value="de-DE">Deutsch (Deutschland)</option>
                                    <option value="fr-FR">Français (France)</option>
                                    <option value="es-ES">Español (España)</option>
                                    <option value="ru-RU">Русский (Россия)</option>
                                    <option value="zh-CN">中文 (中国)</option>
                                    <option value="ja-JP">日本語 (日本)</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none text-light-text-muted dark:text-dark-text-muted" />
                            </div>
                        </div>

                        {/* NSFW Tags Setting */}
                        <div>
                            <label className="block font-medium mb-2">
                                Hidden Tags
                            </label>
                            <textarea
                                value={nsfwTags}
                                onChange={(e) => setNsfwTags(e.target.value)}
                                placeholder="Enter comma-separated tags to hide, e.g., work,secret"
                                className="w-full px-4 py-3 rounded-xl bg-light-bg dark:bg-dark-bg shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none resize-y"
                                rows="3"
                            />
                            <p className="text-xs text-light-text-muted dark:text-dark-text-muted mt-1">
                                Tasks containing these tags will be hidden by default.
                            </p>
                        </div>

                        {/* Theme Setting */}
                        <div>
                            <label className="block font-medium mb-2">
                                Theme Color
                            </label>
                            <div className="grid grid-cols-3 gap-3 p-2 rounded-xl shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark">
                                {[
                                    { id: 'light', label: 'Light', icon: Sun },
                                    { id: 'dark', label: 'Dark', icon: Moon },
                                    { id: 'system', label: 'System', icon: Monitor },
                                ].map(({ id, label, icon: Icon }) => (
                                    <button key={id} onClick={() => setTheme(id)}
                                        className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all duration-150 ${theme === id ? 'text-light-primary dark:text-dark-primary shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark' : 'text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text'}`}
                                    >
                                        <Icon size={20} />
                                        <span className="text-xs font-semibold">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Week Start Setting */}
                        <div>
                            <label className="block font-medium mb-2">
                                First Day of Week
                            </label>
                            <div className="relative">
                                <select
                                    value={weekStart}
                                    onChange={(e) => setWeekStart(parseInt(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl bg-light-bg dark:bg-dark-bg shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none appearance-none pr-10"
                                >
                                    <option value="0">Sunday</option>
                                    <option value="1">Monday</option>
                                    <option value="2">Tuesday</option>
                                    <option value="3">Wednesday</option>
                                    <option value="4">Thursday</option>
                                    <option value="5">Friday</option>
                                    <option value="6">Saturday</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none text-light-text-muted dark:text-dark-text-muted" />
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="border-t pt-6 mt-6 border-light-danger/50 dark:border-dark-danger/50">
                            <label className="block text-light-danger dark:text-dark-danger font-medium mb-2">
                                Danger Zone
                            </label>
                            <button
                                onClick={onClearDatabase}
                                className="w-full px-4 py-3 rounded-xl text-light-danger dark:text-dark-danger shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark transition-all mb-2"
                            >
                                Clear All Data
                            </button>
                            <p className="text-xs text-light-text-muted dark:text-dark-text-muted mt-1 mb-4">
                                This will permanently delete all your tasks, archives, and settings. This action cannot be undone.
                            </p>
                            <button
                                onClick={onExport}
                                className="w-full px-4 py-3 rounded-xl text-light-primary dark:text-dark-primary shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark transition-all"
                            >
                                Export Backup
                            </button>
                            <ImportDropzone />
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={onSave}
                            className="flex-1 px-4 py-3 rounded-xl font-semibold text-light-primary dark:text-dark-primary shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark transition-all"
                        >
                            Save
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
