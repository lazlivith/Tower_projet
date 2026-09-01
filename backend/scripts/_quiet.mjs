// Chargé en tout premier par les scripts de test : env + logs HTTP silencieux.
// (les `import` étant hoistés, ce module doit être importé AVANT ../src/app.js)
import 'dotenv/config';
process.env.LOG_LEVEL ||= 'silent';
