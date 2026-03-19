import client from "./client";

export async function submitComplaint({ text, lat, lng, image }) {
  const formData = new FormData();
  formData.append("text", text);
  formData.append("lat", String(lat));
  formData.append("lng", String(lng));
  formData.append("image", image);

  const response = await client.post("/complaints/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function fetchComplaintById(complaintId) {
  const response = await client.get(`/complaints/${complaintId}`);
  return response.data;
}
