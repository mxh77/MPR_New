// Test des imports pour debug
try {
  console.log('Testing imports...');
  
  // Test individual imports
  const { Input } = require('./src/components/common/Input');
  console.log('Input:', Input);
  
  const { DatePickerModal } = require('./src/components/common/DatePickerModal');
  console.log('DatePickerModal:', DatePickerModal);
  
  const { CurrencyPickerModal } = require('./src/components/common/CurrencyPickerModal');
  console.log('CurrencyPickerModal:', CurrencyPickerModal);
  
  const GooglePlacesInput = require('./src/components/common/GooglePlacesInput').default;
  console.log('GooglePlacesInput:', GooglePlacesInput);
  
  // Test index imports
  const common = require('./src/components/common/index');
  console.log('Common exports:', Object.keys(common));
  console.log('Input from index:', common.Input);
  console.log('DatePickerModal from index:', common.DatePickerModal);
  console.log('CurrencyPickerModal from index:', common.CurrencyPickerModal);
  console.log('GooglePlacesInput from index:', common.GooglePlacesInput);
  
} catch (error) {
  console.error('Import error:', error);
}
