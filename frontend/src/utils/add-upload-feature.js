import httpClient from "./http-client";

const processFileFields = async (params) => {
  const updatedData = { ...params.data };

  for (const dataFieldName in updatedData) {
    const field = updatedData[dataFieldName];

    if (field && !field.src && field.folder) {
      delete updatedData[dataFieldName];
      continue;
    }

    if (field && field.rawFile && field.rawFile instanceof File) {
      const formData = new FormData();
      if (field.folder) {
        formData.append("folder", field.folder);
      }
      formData.append("file", field.rawFile);

      const { json } = await httpClient("/api/v1/uploads", {
        method: "POST",
        body: formData,
      });

      updatedData[dataFieldName] = {
        url: json.data.url,
        originalName: json.data.originalName,
        key: json.data.key,
      };
    }
  }

  return { ...params, data: updatedData };
};

const addUploadFeature = (dataProvider) => ({
  ...dataProvider,
  update: async (resource, params) => {
    const processedParams = await processFileFields(params);
    return dataProvider.update(resource, processedParams);
  },
  create: async (resource, params) => {
    const processedParams = await processFileFields(params);
    return dataProvider.create(resource, processedParams);
  },
});

export default addUploadFeature;
