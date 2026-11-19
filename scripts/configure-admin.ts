import "dotenv/config";
import { configureAdministrator } from "../src/lib/auth";

async function main() {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) throw new Error("Defina ADMIN_PASSWORD no ambiente para configurar o acesso. A senha não é impressa nem exportada.");
  await configureAdministrator(password);
  console.log("Administrador configurado no banco com hash PBKDF2. Nenhuma senha foi impressa.");
}
main().then(() => process.exit(0)).catch((error) => {
  console.error(error instanceof Error ? error.message : "Falha ao configurar administrador.");
  process.exit(1);
});
