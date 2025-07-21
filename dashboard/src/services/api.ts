import axios from 'axios'
import { supabase } from '../supabase'

export const fetchTemperatureData = async () => {
  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token

  const res = await axios.get('https://your-api.execute-api.amazonaws.com/prod/temperatures', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return res.data
}
