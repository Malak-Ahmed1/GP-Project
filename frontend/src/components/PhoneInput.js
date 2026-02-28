import React, { useState, useEffect, useRef } from 'react';
import '../styles/PhoneInput.css';

const countries = [
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' }
];

function PhoneInput({ value, onChange, name }) {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Default to Egypt
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCountries, setFilteredCountries] = useState(countries);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setSearchTerm('');
        setFilteredCountries(countries);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter countries based on search term
  useEffect(() => {
    const filtered = countries.filter(country =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm) ||
      country.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCountries(filtered);
  }, [searchTerm]);

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setShowDropdown(false);
    setSearchTerm('');
    setFilteredCountries(countries);
    // Update the full phone number
    const fullNumber = `${country.dialCode}${phoneNumber}`;
    onChange(fullNumber);
  };

  const handlePhoneNumberChange = (e) => {
    const newPhoneNumber = e.target.value.replace(/[^0-9\s()-]/g, '');
    setPhoneNumber(newPhoneNumber);
    // Update the full phone number
    const fullNumber = `${selectedCountry.dialCode}${newPhoneNumber}`;
    onChange(fullNumber);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Initialize with existing value if provided
  useEffect(() => {
    if (value && typeof value === 'string') {
      // Find the country that matches the dial code in the value
      const country = countries.find(c => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.replace(country.dialCode, ''));
      }
    }
  }, [value]);

  return (
    <div className="phone-input-container">
      <div className="phone-input-wrapper">
        {/* Country Code Dropdown */}
        <div className="country-dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="country-selector"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Country selector clicked, current state:', showDropdown);
              setShowDropdown(!showDropdown);
            }}
          >
            <span className="country-flag">{selectedCountry.flag}</span>
            <span className="country-code">{selectedCountry.dialCode}</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          
          {showDropdown && (
            <div className="country-dropdown-menu" style={{zIndex: 9999}}>
              <div className="dropdown-search">
                <input
                  type="text"
                  placeholder="Search country..."
                  className="search-input"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="country-list">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <div
                      key={country.code}
                      className="country-option"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCountryChange(country);
                      }}
                    >
                      <span className="country-flag">{country.flag}</span>
                      <span className="country-name">{country.name}</span>
                      <span className="country-dial-code">{country.dialCode}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-results">
                    No countries found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          className="phone-number-input"
          placeholder="Phone number"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
        />
      </div>
      
      {/* Display Full Number */}
      {phoneNumber && (
        <div className="full-phone-display">
          Full number: {selectedCountry.dialCode} {phoneNumber}
        </div>
      )}
    </div>
  );
}

export default PhoneInput;
