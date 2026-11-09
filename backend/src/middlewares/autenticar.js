
const { verificarToken } = require("../config/jwt");

function autenticar(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    // Verifica se o cabeçalho foi enviado.
    if (!authorization) {
      return res.status(401).json({
        erro: "Token de autenticação não informado.",
        campos: {},
      });
    }

    // Divide o cabeçalho e valida o formato Bearer.
    const partes = authorization.trim().split(/\s+/);

    if (
      partes.length !== 2 ||
      partes[0] !== "Bearer" ||
      !partes[1]
    ) {
      return res.status(401).json({
        erro: "Formato de autenticação inválido.",
        campos: {},
      });
    }

    const token = partes[1];

    // Valida o token.
    const dados = verificarToken(token);

    // Confirma se o token contém um ID de usuário válido.
    if (!Number.isInteger(dados.usuarioId) || dados.usuarioId <= 0) {
      return res.status(401).json({
        erro: "Token inválido ou expirado.",
        campos: {},
      });
    }

    // Identifica o usuário da requisição.
    req.usuarioId = dados.usuarioId;

    // Permite continuar para a rota.
    next();
  } catch (erro) {
    return res.status(401).json({
      erro: "Token inválido ou expirado.",
      campos: {},
    });
  }
}

module.exports = autenticar;
