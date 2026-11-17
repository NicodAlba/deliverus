import { API_BASE_URL } from '@env'
import { imageUrl } from '../../../../demo/staticApi'

export const getImageUrl = value => imageUrl(API_BASE_URL, value)
