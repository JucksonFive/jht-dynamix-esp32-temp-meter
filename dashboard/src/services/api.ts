import axios from "axios";
import { fetchAuthSession } from "@aws-amplify/auth";

export const fetchTemperatureData = async () => {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken.toString();

  const res = await axios.get(
    "https://your-api.execute-api.amazonaws.com/prod/temperatures",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};
