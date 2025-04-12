import React from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { AnonymizationSettings as Settings } from '../ResumeAnonymizer';

interface AnonymizationSettingsProps {
    settings: Settings;
    onChange: (settings: Settings) => void;
    onApplyToAll: () => void;
    disabled?: boolean;
}

const AnonymizationSettings: React.FC<AnonymizationSettingsProps> = ({
                                                                         settings,
                                                                         onChange,
                                                                         onApplyToAll,
                                                                         disabled = false,
                                                                     }) => {
    // Handle checkbox change
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        onChange({
            ...settings,
            [name]: checked,
        });
    };

    return (
        <Card
            title="Anonymization Settings"
            subtitle="Select what information to anonymize"
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center">
                        <input
                            id="replace-names"
                            name="replaceNames"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                            checked={settings.replaceNames}
                            onChange={handleCheckboxChange}
                            disabled={disabled}
                        />
                        <label htmlFor="replace-names" className="ml-2 block text-sm text-neutral-700">
                            Names
                        </label>
                    </div>
                    <p className="text-xs text-neutral-500 ml-6">Replaces detected names with [NAME]</p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center">
                        <input
                            id="replace-emails"
                            name="replaceEmails"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                            checked={settings.replaceEmails}
                            onChange={handleCheckboxChange}
                            disabled={disabled}
                        />
                        <label htmlFor="replace-emails" className="ml-2 block text-sm text-neutral-700">
                            Email Addresses
                        </label>
                    </div>
                    <p className="text-xs text-neutral-500 ml-6">Replaces email addresses with [EMAIL]</p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center">
                        <input
                            id="replace-phones"
                            name="replacePhones"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                            checked={settings.replacePhones}
                            onChange={handleCheckboxChange}
                            disabled={disabled}
                        />
                        <label htmlFor="replace-phones" className="ml-2 block text-sm text-neutral-700">
                            Phone Numbers
                        </label>
                    </div>
                    <p className="text-xs text-neutral-500 ml-6">Replaces phone numbers with [PHONE]</p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center">
                        <input
                            id="replace-addresses"
                            name="replaceAddresses"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                            checked={settings.replaceAddresses}
                            onChange={handleCheckboxChange}
                            disabled={disabled}
                        />
                        <label htmlFor="replace-addresses" className="ml-2 block text-sm text-neutral-700">
                            Addresses
                        </label>
                    </div>
                    <p className="text-xs text-neutral-500 ml-6">Replaces physical addresses with [ADDRESS]</p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center">
                        <input
                            id="replace-social"
                            name="replaceSocial"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                            checked={settings.replaceSocial}
                            onChange={handleCheckboxChange}
                            disabled={disabled}
                        />
                        <label htmlFor="replace-social" className="ml-2 block text-sm text-neutral-700">
                            Social Media Profiles
                        </label>
                    </div>
                    <p className="text-xs text-neutral-500 ml-6">Replaces social media links with [SOCIAL MEDIA]</p>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-200">
                    <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        onClick={onApplyToAll}
                        disabled={disabled}
                    >
                        Apply Settings to All Resumes
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default AnonymizationSettings;
