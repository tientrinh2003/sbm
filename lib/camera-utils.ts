/**
 * Camera utility functions for handling camera access and troubleshooting
 */

export interface CameraInfo {
  isSupported: boolean;
  isSecureContext: boolean;
  hasPermission: boolean | null;
  devices: MediaDeviceInfo[];
  error?: string;
}

/**
 * Check camera support and get diagnostic information
 */
export async function getCameraInfo(): Promise<CameraInfo> {
  const info: CameraInfo = {
    isSupported: false,
    isSecureContext: window.isSecureContext,
    hasPermission: null,
    devices: []
  };

  try {
    // Check if mediaDevices API is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      info.error = 'Browser không hỗ trợ Camera API';
      return info;
    }

    info.isSupported = true;

    // Check permission status if available
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        info.hasPermission = permission.state === 'granted';
      } catch (e) {
        // Permission API not supported or camera permission not available
        console.log('Permission API not available for camera');
      }
    }

    // Get available devices
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      info.devices = devices.filter(device => device.kind === 'videoinput');
    } catch (e) {
      console.error('Error enumerating devices:', e);
      info.error = 'Không thể liệt kê thiết bị camera';
    }

  } catch (error: any) {
    info.error = `Lỗi kiểm tra camera: ${error.message}`;
  }

  return info;
}

/**
 * Test camera access with progressive fallback
 */
export async function testCameraAccess(deviceId?: string): Promise<{
  success: boolean;
  stream?: MediaStream;
  error?: string;
  constraints?: MediaStreamConstraints;
}> {
  const constraints: MediaStreamConstraints[] = [
    // High quality
    {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      }
    },
    // Medium quality
    {
      video: {
        deviceId: deviceId ? { ideal: deviceId } : undefined,
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 15 }
      }
    },
    // Basic quality
    {
      video: {
        width: { ideal: 320 },
        height: { ideal: 240 }
      }
    },
    // Minimal
    {
      video: true
    }
  ];

  for (let i = 0; i < constraints.length; i++) {
    try {
      console.log(`Testing camera constraint set ${i + 1}:`, constraints[i]);
      const stream = await navigator.mediaDevices.getUserMedia(constraints[i]);
      
      return {
        success: true,
        stream,
        constraints: constraints[i]
      };
    } catch (error: any) {
      console.log(`Constraint set ${i + 1} failed:`, error.name);
      
      if (i === constraints.length - 1) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  }

  return {
    success: false,
    error: 'Không thể khởi tạo camera với bất kỳ cấu hình nào'
  };
}

/**
 * Release camera stream properly
 */
export function releaseCameraStream(stream: MediaStream): void {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
      console.log(`Released ${track.kind} track: ${track.label}`);
    });
  }
}

/**
 * Get user-friendly error message
 */
export function getCameraErrorMessage(error: DOMException | Error): string {
  if (error.name === 'NotAllowedError') {
    return 'Quyền truy cập camera bị từ chối. Vui lòng cho phép truy cập và refresh trang.';
  } else if (error.name === 'NotFoundError') {
    return 'Không tìm thấy camera nào. Hãy kết nối camera và thử lại.';
  } else if (error.name === 'NotReadableError') {
    return 'Camera đang được sử dụng bởi ứng dụng khác. Hãy đóng các ứng dụng khác và thử lại.';
  } else if (error.name === 'OverconstrainedError') {
    return 'Camera không hỗ trợ các cài đặt yêu cầu. Đang thử cài đặt thấp hơn...';
  } else if (error.name === 'SecurityError') {
    return 'Lỗi bảo mật camera. Hãy sử dụng HTTPS hoặc localhost.';
  } else if (error.name === 'AbortError') {
    return 'Quá trình khởi tạo camera bị hủy.';
  } else {
    return `Lỗi camera: ${error.message}`;
  }
}

/**
 * Check if browser supports camera
 */
export function isCameraSupported(): boolean {
  return !!(
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia &&
    window.MediaStream
  );
}

/**
 * Check if running in secure context (HTTPS or localhost)
 */
export function isSecureContext(): boolean {
  return window.isSecureContext || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
}

/**
 * Get browser-specific troubleshooting tips
 */
export function getTroubleshootingTips(): string[] {
  const userAgent = navigator.userAgent.toLowerCase();
  const tips = [
    'Đóng tất cả tab/ứng dụng khác đang sử dụng camera',
    'Refresh trang và cho phép truy cập camera khi được hỏi',
    'Kiểm tra camera hoạt động bình thường trong ứng dụng khác'
  ];

  if (userAgent.includes('chrome')) {
    tips.push('Chrome: Kiểm tra Settings > Privacy > Camera');
    tips.push('Đảm bảo trang web được cho phép truy cập camera');
  } else if (userAgent.includes('firefox')) {
    tips.push('Firefox: Kiểm tra Preferences > Privacy & Security > Camera');
    tips.push('Xóa và cấp lại quyền truy cập camera');
  } else if (userAgent.includes('safari')) {
    tips.push('Safari: Kiểm tra Safari > Settings > Websites > Camera');
    tips.push('Đảm bảo camera được bật cho website này');
  }

  if (!isSecureContext()) {
    tips.push('⚠️ Sử dụng HTTPS thay vì HTTP để truy cập camera');
  }

  return tips;
}