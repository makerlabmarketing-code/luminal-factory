// ultis/geocoding.ts

interface GeocodeResponse {
    lat: string;
    lng: string;
    success: boolean;
    error?: string;
  }
  
  /**
   * Hàm gọi API bản đồ để chuyển chuỗi địa chỉ thành tọa độ thực tế (Vĩ độ / Kinh độ)
   * @param address Địa chỉ văn bản cụ thể của xưởng
   */
  export async function fetchCoordinatesFromAddress(address: string): Promise<GeocodeResponse> {
    if (!address || address.trim() === '') {
      return { lat: '', lng: '', success: false, error: 'Địa chỉ không được để trống' };
    }
  
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: { 
            'User-Agent': 'Luminal-Factory-ERP' 
          }
        }
      );
  
      if (!response.ok) {
        throw new Error('Không thể kết nối đến hệ thống máy chủ bản đồ vệ tinh.');
      }
  
      const data = await response.json();
  
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat).toFixed(6),
          lng: parseFloat(data[0].lon).toFixed(6),
          success: true
        };
      }
  
      return { 
        lat: '', 
        lng: '', 
        success: false, 
        error: 'Không tìm thấy tọa độ tương ứng. Sếp vui lòng nhập địa chỉ chi tiết hơn!' 
      };
    } catch (error: any) {
      return {
        lat: '',
        lng: '',
        success: false,
        error: error?.message || 'Lỗi hệ thống bản đồ ngoại vi.'
      };
    }
  }