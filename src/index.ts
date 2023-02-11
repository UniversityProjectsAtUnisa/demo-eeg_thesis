if (process.env.REACT_APP_WEB_ACTIVE) {
  const { render } = require('./app');
  const { createBrowserRouter } = require('react-router-dom');
  render(createBrowserRouter);
} else {
  require('./electronIndex');
}
