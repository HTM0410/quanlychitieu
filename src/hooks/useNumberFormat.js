import { useState, useEffect } from 'react'

/**
 * Custom hook để định dạng số tiền theo format tiền tệ Việt Nam
 * @param {number|string} initialValue - Giá trị ban đầu
 * @returns {Array} - [displayValue, actualValue, handleChange]
 */
const useNumberFormat = (initialValue = '') => {
  // Giá trị hiển thị cho người dùng (có định dạng)
  const [displayValue, setDisplayValue] = useState('')
  // Giá trị thực tế được lưu (số)
  const [actualValue, setActualValue] = useState(initialValue)

  // Khởi tạo giá trị hiển thị từ giá trị ban đầu
  useEffect(() => {
    if (initialValue) {
      const formatted = formatNumberWithCommas(initialValue.toString())
      setDisplayValue(formatted)
      setActualValue(initialValue)
    }
  }, [initialValue])

  /**
   * Định dạng số với dấu chấm phân cách hàng nghìn
   * @param {string} value - Chuỗi cần định dạng
   * @returns {string} - Chuỗi đã định dạng
   */
  const formatNumberWithCommas = (value) => {
    // Loại bỏ tất cả ký tự không phải số
    const numericValue = value.replace(/\D/g, '')
    
    // Chuyển thành số và định dạng với dấu chấm ngăn cách hàng nghìn
    if (numericValue === '') return ''
    
    // Sử dụng Intl.NumberFormat để định dạng số theo tiêu chuẩn Việt Nam
    return new Intl.NumberFormat('vi-VN', {
      style: 'decimal',
      useGrouping: true,
      maximumFractionDigits: 0
    }).format(parseInt(numericValue, 10))
  }

  /**
   * Xử lý sự kiện thay đổi giá trị nhập vào
   * @param {Event} e - Sự kiện onChange
   */
  const handleChange = (e) => {
    const inputValue = e.target.value
    
    // Chỉ xử lý khi có giá trị nhập vào
    if (inputValue !== '') {
      // Loại bỏ tất cả ký tự không phải số
      const numericValue = inputValue.replace(/\D/g, '')
      
      // Cập nhật giá trị thực tế
      if (numericValue) {
        setActualValue(numericValue)
        // Định dạng giá trị hiển thị
        const formatted = formatNumberWithCommas(numericValue)
        setDisplayValue(formatted)
      } else {
        // Nếu không có giá trị số, đặt cả hai về rỗng
        setActualValue('')
        setDisplayValue('')
      }
    } else {
      // Nếu input rỗng, đặt cả hai về rỗng
      setActualValue('')
      setDisplayValue('')
    }
  }

  return [displayValue, actualValue, handleChange]
}

export default useNumberFormat 