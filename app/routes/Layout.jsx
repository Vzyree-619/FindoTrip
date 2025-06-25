// app/components/Layout.jsx
import { Link } from 'react-router-dom';
// import ExpensesList from '../components/expenses/ExpensesList';

const Layout = ({ children }) => {
  return (
    <div>
      <header>
        <h1>shared data page</h1>
       
      </header>
      {/* <ExpensesList/> */}
      <main>{children}</main>
    </div>
  );
};

export default Layout;
