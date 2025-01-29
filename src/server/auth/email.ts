import { render } from "@react-email/render";
import { Resend } from "resend";
import VerificationEmailTemplate from "~/emails/verification-email";
import { env } from "~/env";

export const resend = new Resend(env.RESERND_API_KEY);

export const sendVerificationEmail = async ({
  email,
  verificationUrl,
}: {
  email: string;
  verificationUrl: string;
}) => {
  return await resend.emails.send({
    from: env.EMAIL_FROM,
    to: [email],
    subject: "Verify your Email address",
    html: await render(
      VerificationEmailTemplate({ inviteLink: verificationUrl }),
    ),
  });
};
