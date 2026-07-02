export async function createRecord(model, data) {
  return model.create({
    data,
  });
}