// app/components/Layout.jsx
import NavBar from "~/components/layout/navigation/NavBar";
import { Link } from "react-router-dom";
// import ExpensesList from '../components/expenses/ExpensesList';

const Layout = ({ children }) => {
  return (
    <div>
      {/* <header>
        <NavBar />
      </header> */}
      {/* <ExpensesList/> */}
      <main>{children}</main>
    </div>
  );
};

export default Layout;
