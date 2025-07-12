import React, { useState } from 'react';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  required?: boolean;
}

const countryCodes = [
  { value: '+31', label: 'Netherlands (+31)' },
  { value: '+32', label: 'Belgium (+32)' },
  { value: '+49', label: 'Germany (+49)' },
  { value: '+33', label: 'France (+33)' },
  { value: '+44', label: 'United Kingdom (+44)' },
  { value: '+1', label: 'United States/Canada (+1)' },
];

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  error,
  className = '',
  required = false,
}) => {
  // Extract country code and number from the full value
  const [countryCode, setCountryCode] = useState(() => {
    const code = countryCodes.find(c => value?.startsWith(c.value));
    return code?.value || '+31'; // Default to Netherlands
  });

  const [localNumber, setLocalNumber] = useState(() => {
    const code = countryCodes.find(c => value?.startsWith(c.value));
    return code ? value.slice(code.value.length).trim() : value || '';
  });

  const handleCountryCodeChange = (newCode: string) => {
    setCountryCode(newCode);
    const newValue = `${newCode} ${localNumber}`.trim();
    onChange(newValue);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/[^0-9]/g, '');
    setLocalNumber(newNumber);
    const newValue = `${countryCode} ${newNumber}`.trim();
    onChange(newValue);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <Select value={countryCode} onValueChange={handleCountryCodeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countryCodes.map((code) => (
              <SelectItem key={code.value} value={code.value}>
                {code.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="tel"
          value={localNumber}
          onChange={handleNumberChange}
          placeholder="612345678"
          className="flex-1"
          required={required}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="text-xs text-gray-500">
        Please do not enter country code in the number field
      </p>
    </div>
  );
}; 