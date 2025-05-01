const getMsg = async () => {
  try {
    return "";
  } catch {
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
