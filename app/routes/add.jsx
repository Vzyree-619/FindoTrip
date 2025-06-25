
import React from 'react';
import Layout from './Layout';
import ExpenseForm from '../components/expenses/ExpenseForm';
import MainHeader from '../components/navigation/MainHeader'
const AddUser = () => {
  return (
    <div>
      <Layout>
      <h1>Add New User</h1>
      <MainHeader/>
    <ExpenseForm/>
    </Layout>
    </div>
  );
};

export default AddUser;
