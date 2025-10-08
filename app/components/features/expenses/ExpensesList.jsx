import  ExpenseListItem from './ExpenseListItem'
function ExpensesList({ expenses = [] }) {
  // Dummy Data
  const dummyExpenses = [
    { id: 1, title: "Groceries", amount: 50.75 },
    { id: 2, title: "Rent", amount: 1200.0 },
    { id: 3, title: "Internet Bill", amount: 45.99 },
  ];

  return (
    <ol className="w-full max-w-lg mx-auto p-4 space-y-4">
      {(expenses.length ? expenses : dummyExpenses).map((expense) => (
        <li
          key={expense.id}
          className="bg-black text-white shadow-lg rounded-lg p-4 flex justify-between items-center border border-white"
        >
          <ExpenseListItem
            className="bg-white text-blue-800"
            id={expense.id}
            title={expense.title}
            amount={expense.amount}
          />
        </li>
      ))}
    </ol>
  );
}

export default ExpensesList;
