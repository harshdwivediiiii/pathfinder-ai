import PropTypes from 'prop-types';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center pb-20">
      {children}
    </div>
  );
};
  
AuthLayout.propTypes = {
  children: PropTypes.node,
};

export default AuthLayout;
