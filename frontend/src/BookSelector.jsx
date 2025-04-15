import { useEffect } from "react";
import CustomDropdown from "./CustomDropdown";

function BookSelector({ booksInventories, onBookChange, selectedValue = 'total' }) {
  useEffect(() => {
    console.log('BookSelector mounted');
  }, []);

  const options = [
    { value: 'total', label: 'Total' },
    ...(booksInventories?.map(book => ({
      value: book.bookId,
      label: book.title
    })) || [])
  ];

  const handleChange = (value) => {
    onBookChange({ target: { value } });
  };

  return (
    <CustomDropdown
      options={options}
      defaultOption={options.find(opt => opt.value === selectedValue) || options[0]}
      onChange={handleChange}
    />
  );
}

export default BookSelector;
