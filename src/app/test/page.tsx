import { api } from "~/trpc/server";

const getMsg = async () => {
  try {
    const msg = await api.post.getSecretMessage();
    return msg;
  } catch (error) {
    return "⛔ Error";
  }
};

const TestPage = async () => {
  const secretMessage = await getMsg();

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4">
      <h1>Protected Test Page!!</h1>
      <p>{secretMessage}</p>
    </div>
  );
};

export default TestPage;
