import { execSync } from "child_process";

function main() {
  const testDBURL = "postgresql://cordub:ThankGod89\!@localhost:5432/wasBackend_test_template"

  execSync(`DATATBASE_URL="${testDBURL}" npx prisma migrate deploy`, { stdio: "inherit" });
}

main();