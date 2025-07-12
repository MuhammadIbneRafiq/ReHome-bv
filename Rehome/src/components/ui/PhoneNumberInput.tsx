import React from 'react';
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  error?: string;
  className?: string;
  required?: boolean;
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  error,
  className = '',
  required = false,
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="[&_.PhoneInput]:flex [&_.PhoneInput]:items-center 
                      [&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center [&_.PhoneInputCountry]:gap-0 [&_.PhoneInputCountry]:min-w-[80px]
                      [&_.PhoneInputCountrySelect]:border-none [&_.PhoneInputCountrySelect]:bg-transparent [&_.PhoneInputCountrySelect]:p-1 [&_.PhoneInputCountrySelect]:cursor-pointer
                      [&_.PhoneInputCountryIcon]:w-6 [&_.PhoneInputCountryIcon]:h-4 [&_.PhoneInputCountryIcon]:object-cover
                      [&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:p-0 [&_.PhoneInputInput]:m-0 [&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:bg-transparent
                      [&_.PhoneInputInput:focus]:outline-none [&_.PhoneInputInput:focus]:shadow-none">
        <PhoneInput
          international
          countryCallingCodeEditable={false}
          value={value}
          onChange={(newValue) => {
            const phoneValue = newValue || '';
            const isValid = newValue ? isValidPhoneNumber(newValue) : false;
            onChange(phoneValue, isValid);
          }}
          placeholder="Select country code and enter number"
          className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-red-500' : ''}`}
          required={required}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}; 