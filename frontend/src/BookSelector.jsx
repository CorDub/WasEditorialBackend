import CustomDropdown from "./CustomDropdown";

function BookSelector({
    booksInventories,
    onBookChange,
    selectedValue = 'total',
    reset,
    setReset,
    fontSize }) {
  const options = [
    { value: 'total', label: 'Todos los titulos' },
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
      reset={reset}
      setReset={setReset}
      fontSize={fontSize}
    />
  );
}

export default BookSelector;
