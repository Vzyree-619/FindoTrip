function ExpenseListItem({ title, amount }) {
  function deleteExpenseItemHandler() {
    // tbd
  }

  return (
    <article className="expense-item flex justify-end items-end mr-0  ">
      <div>
        <h2 className="expense-title">{title}</h2>
        <p className="expense-amount">${amount.toFixed(2)}</p>
      </div>
      <menu className="expense-actions   ml-[250px] ">
        <button className="mr-4" onClick={deleteExpenseItemHandler}>Delete</button>
        <a href="tbd">Edit</a>
      </menu>
    </article>
  );
}

export default ExpenseListItem;
