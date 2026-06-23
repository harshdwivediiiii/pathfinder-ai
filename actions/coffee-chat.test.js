const { prismaMock } = require("../singleton.js");

const coffeeChatHandler = require("./coffee-chat.js");

test("Should create CoffeeChatSession successfully", async () => {
  const requestBody = {
    industry: "saas",
    targetRole: "software engineer"
  };

  prismaMock.coffeeChatSession.create.mockResolvedValue({
    id: "test-session-id",
    createdAt: new Date(),
    updatedAt: new Date(),
    industry: requestBody.industry,
    targetRole: requestBody.targetRole
  });

  const response = await coffeeChatHandler.createSession(requestBody);

  expect(response).toEqual({
    id: "test-session-id",
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
    industry: "saas",
    targetRole: "software engineer"
  });
  expect(prismaMock.coffeeChatSession.create).toHaveBeenCalledWith({
    data: requestBody
  });
});
