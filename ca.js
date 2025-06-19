class ServerFeatures {
  constructor(baseUrl) {
    if (!baseUrl) {
      throw new Error('Base URL must be provided.');
    }
    this.baseUrl = baseUrl;
    this.socket = null;
  }

  // 파일 업로드 기능
  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // 실시간 채팅 기능
  connectToChat(chatRoomId) {
    try {
      this.socket = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/chat/${chatRoomId}`);

      this.socket.onopen = () => {
        console.log('Connected to chat server');
      };

      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('New message:', message);
        // 원하는 동작 추가 가능 (예: UI 업데이트)
      };

      this.socket.onclose = () => {
        console.log('Disconnected from chat server');
      };

      this.socket.onerror = (error) => {
        console.error('Chat socket error:', error);
      };
    } catch (error) {
      console.error('Error connecting to chat server:', error);
      throw error;
    }
  }

  sendMessage(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ message }));
    } else {
      console.error('Socket is not connected or open');
    }
  }

  disconnectChat() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  // 데이터 저장 기능
  async saveData(key, value) {
    try {
      const response = await fetch(`${this.baseUrl}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save data: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  }

  async getData(key) {
    try {
      const response = await fetch(`${this.baseUrl}/get?key=${encodeURIComponent(key)}`);

      if (!response.ok) {
        throw new Error(`Failed to retrieve data: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error retrieving data:', error);
      throw error;
    }
  }

  async deleteData(key) {
    try {
      const response = await fetch(`${this.baseUrl}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete data: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting data:', error);
      throw error;
    }
  }
}

export default ServerFeatures;
