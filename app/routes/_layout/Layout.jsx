// app/components/Layout.jsx
// import { Link } from 'react-router-dom';
// import ExpensesList from '../components/expenses/ExpensesList';
import PropTypes from 'prop-types';

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

Layout.propTypes = {
  children: PropTypes.node
};

export default Layout;
