import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CourseStackModule = buildModule("CourseStack", (m) => {
  const registry = m.contract("CourseRegistry");
  const purchase = m.contract("CoursePurchase", [registry]);
  const admin = m.getAccount(0);
  const certificate = m.contract("CertificateNFT", [
    "Blockchain Weblearning Certificate",
    "BWL-CERT",
    admin,
  ]);

  return { registry, purchase, certificate };
});

export default CourseStackModule;
