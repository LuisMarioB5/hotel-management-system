import { loginIntegration } from "../integrations/login.integration.js";
import { validateFields } from "../validations/login.form.js";

validateFields();
loginIntegration();