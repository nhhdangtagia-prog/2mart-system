module.exports = {
  '2mart-erp': {
    input: '../../docs/openapi.yaml',
    output: {
      mode: 'tags-split',
      target: 'src/generated/endpoints.ts',
      schemas: 'src/generated/models',
      client: 'react-query',
      mock: true
    }
  }
};
