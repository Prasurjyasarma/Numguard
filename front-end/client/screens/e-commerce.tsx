import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
  Animated,
  Clipboard,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../api";

interface Message {
  id: number;
  virtual_number: number;
  sender: string;
  message_body: string;
  category: string;
  is_read: boolean;
  received_at: string;
  created_at: string;
}

interface VirtualNumber {
  id: number;
  numbers: string;
  category: string;
  physical_number: number;
  is_active: boolean;
}

const Ecommerce: React.FC = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [currentCategory, setCurrentCategory] = useState("e-commerce");
  const [currentVirtualNumber, setCurrentVirtualNumber] = useState("");
  const [virtualNumberId, setVirtualNumberId] = useState<number | null>(null);
  const [isVirtualNumberActive, setIsVirtualNumberActive] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
  const [messageDeleteLoading, setMessageDeleteLoading] = useState(false);
  const [messageDeleteModalVisible, setMessageDeleteModalVisible] = useState(false);
  const [deactivateModalVisible, setDeactivateModalVisible] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [isMessagesActive, setIsMessagesActive] = useState(true);
  const [deactivateCalls, setDeactivateCalls] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use Platform-specific container
  const Container = Platform.OS === 'ios' ? SafeAreaView : View;

  useEffect(() => {
    const fetchVirtualNumber = async () => {
      try {
        const response = await api.get(
          `/virtual-numbers/?category=${currentCategory}`
        );
        if (response.data && response.data.length > 0) {
          const virtualNumberData = response.data[0];
          setCurrentVirtualNumber(virtualNumberData.numbers);
          setVirtualNumberId(virtualNumberData.id);
          setIsVirtualNumberActive(virtualNumberData.is_active);
          setIsMessagesActive(virtualNumberData.is_message_active || false);
          setDeactivateCalls(virtualNumberData.deactivate_calls || false);
        } else {
          setCurrentVirtualNumber("No number available");
          setIsVirtualNumberActive(false);
        }
      } catch (error) {
        console.error("Error fetching virtual number:", error);
        Alert.alert("Error", "Failed to fetch virtual number");
      } finally {
        setLoading(false);
      }
    };

    fetchVirtualNumber();
  }, [currentCategory]);

  const fetchMessages = async () => {
    setIsAutoRefreshing(true);
    try {
      const response = await api.get(`/forward-message/?category=${currentCategory}`);
  
      const messages = response.data || [];
      setMessages(messages);
  
      const total = messages.length;
      const unread = messages.filter((msg: Message) => !msg.is_read).length;
  
      setTotalNotifications(total);
      setUnreadNotifications(unread);
    } catch (error: any) {
      const status = error?.response?.status;
  
      if (status === 404) {
        // 404 - No messages found, just reset the state silently
        setMessages([]);
        setTotalNotifications(0);
        setUnreadNotifications(0);
      } else {
        // Show alert only for non-404 errors and log them
        if (!isAutoRefreshing) {
          Alert.alert("Error", "Failed to fetch messages");
        }
        console.error("Error fetching messages:", error);
      }
    } finally {
      setMessagesLoading(false);
      setIsAutoRefreshing(false);
    }
  };

  
  useEffect(() => {
    if (currentCategory) {
      fetchMessages();
    }
    
    autoRefreshIntervalRef.current = setInterval(() => {
      if (currentCategory) {
        fetchMessages();
      }
    }, 3000);
    
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [currentCategory]);

  const copyToClipboard = () => {
    if (currentVirtualNumber && currentVirtualNumber !== "No number available") {
      Clipboard.setString(currentVirtualNumber);
      showNotificationPopup("Number copied to clipboard");
    }
  };

  const showNotificationPopup = (message: string, type: "success" | "error" = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowPopup(false);
      });
    }, 3000);
  };

  const handleNotificationPress = async (id: number) => {
    try {
      const response = await api.get(`/read-message/${id}/`);
      if (response.status === 200) {
        const updatedMessages = messages.map((msg) =>
          msg.id === id ? { ...msg, is_read: true } : msg
        );
        setMessages(updatedMessages);
        const updatedUnreadCount = unreadNotifications > 0 ? unreadNotifications - 1 : 0;
        setUnreadNotifications(updatedUnreadCount);
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
      Alert.alert("Error", "Failed to mark message as read");
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} - ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const handleDeleteConfirmation = () => {
    setModalVisible(true);
  };

  const handleCancelDelete = () => {
    setModalVisible(false);
  };

  const handleConfirmDelete = async () => {
    if (virtualNumberId) {
      try {
        setDeleteLoading(true);
        const response = await api.delete(
          `/delete-virtual-number/${virtualNumberId}/`
        );
        if (response.status === 200) {
          setModalVisible(false);
          router.push("/virtual-number-call");
        }
      } catch (error) {
        console.error("Error deleting virtual number:", error);
        Alert.alert("Error", "Failed to delete virtual number");
        setDeleteLoading(false);
        setModalVisible(false);
      }
    } else {
      Alert.alert("Error", "No virtual number to delete");
      setModalVisible(false);
    }
  };

  const handleMessageDeleteRequest = (messageId: number) => {
    setMessageToDelete(messageId);
    setMessageDeleteModalVisible(true);
  };

  const handleCancelMessageDelete = () => {
    setMessageToDelete(null);
    setMessageDeleteModalVisible(false);
  };

  const handleConfirmMessageDelete = async () => {
    if (messageToDelete) {
      try {
        setMessageDeleteLoading(true);
        const response = await api.delete(`/delete-message/${messageToDelete}/`);
        if (response.status === 200) {
          const updatedMessages = messages.filter(msg => msg.id !== messageToDelete);
          setMessages(updatedMessages);
          const wasUnread = messages.find(msg => msg.id === messageToDelete)?.is_read === false;
          setTotalNotifications(prevTotal => prevTotal - 1);
          if (wasUnread) {
            setUnreadNotifications(prevUnread => prevUnread - 1);
          }
          setMessageDeleteModalVisible(false);
          showNotificationPopup("Message deleted successfully");
        }
      } catch (error) {
        console.error("Error deleting message:", error);
        showNotificationPopup("Failed to delete message", "error");
      } finally {
        setMessageDeleteLoading(false);
        setMessageToDelete(null);
      }
    }
  };

  const handleDeactivateConfirmation = () => {
    setDeactivateModalVisible(true);
  };

  const handleCancelDeactivate = () => {
    setDeactivateModalVisible(false);
  };

  const handleConfirmDeactivate = async () => {
    if (virtualNumberId) {
      try {
        setDeactivateLoading(true);
        const response = await api.post(`/deactivate-virtual-number/${virtualNumberId}/`, {
          deactivate_calls: deactivateCalls,
        });
        
        if (response.status === 200) {
          setIsVirtualNumberActive(!isVirtualNumberActive);
          setDeactivateModalVisible(false);
          const statusMessage = isVirtualNumberActive ? 
            "Virtual number deactivated successfully" : 
            "Virtual number activated successfully";
          showNotificationPopup(statusMessage);
        }
      } catch (error) {
        console.error("Error toggling virtual number status:", error);
        showNotificationPopup("Failed to update virtual number status", "error");
      } finally {
        setDeactivateLoading(false);
      }
    } else {
      showNotificationPopup("No virtual number to update", "error");
      setDeactivateModalVisible(false);
    }
  };

  const handleToggleMessages = async () => {
    if (virtualNumberId) {
      try {
        console.log("Toggling message status for virtualNumberId:", virtualNumberId);
        console.log("Current isMessagesActive state:", isMessagesActive);
        
        const response = await api.post(
          `/deactivate-virtual-number-message/${virtualNumberId}/`,
          {}
        );
        
        console.log("API response:", response.data);
        
        if (response.status === 200) {
          setIsMessagesActive(prevState => !prevState);
          
          const newState = !isMessagesActive;
          console.log("New isMessagesActive state will be:", newState);
          
          const statusMessage = newState ? 
            "Messages activated successfully" : 
            "Messages deactivated successfully";
          showNotificationPopup(statusMessage);
        }
      } catch (error) {
        console.error("Error toggling message status:", error);
        
        if (error && typeof error === 'object' && 'response' in error) {
          const errorObj = error as { response?: { data?: any } };
          console.error("Error details:", errorObj.response?.data || "No response data");
        } else if (error && typeof error === 'object' && 'message' in error) {
          console.error("Error message:", (error as { message: string }).message);
        }
        
        showNotificationPopup("Failed to update message status", "error");
      }
    } else {
      showNotificationPopup("No virtual number available", "error");
    }
  };

  const formatCategoryName = (category: string) => {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Container style={[styles.safeArea, Platform.OS === 'android' && styles.androidSafeArea]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {formatCategoryName(currentCategory)}
            </Text>
            <View style={styles.numberContainer}>
              <Text style={styles.headerNumber}>
                {loading ? "Loading..." : currentVirtualNumber}
              </Text>
              {currentVirtualNumber && currentVirtualNumber !== "No number available" && (
                <TouchableOpacity 
                  style={styles.copyButton} 
                  onPress={copyToClipboard}
                >
                  <Ionicons name="copy-outline" size={18} color="#000" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.statsRow}>
            <View style={styles.statsBox}>
              <Text style={styles.statsLabel}>Total notifications</Text>
              <Text style={styles.statsValue}>{totalNotifications}</Text>
            </View>
            <View style={styles.statsBox}>
              <Text style={styles.statsLabel}>Unread notifications</Text>
              <Text style={styles.statsValue}>{unreadNotifications}</Text>
            </View>
          </View>
        </View>

        {virtualNumberId && (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteConfirmation}
            >
              <Text style={styles.buttonText}>delete number</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deactivateButton, 
                isVirtualNumberActive ? { backgroundColor: "#FFA500" } : { backgroundColor: "#4CAF50" }
              ]}
              onPress={handleDeactivateConfirmation}
            >
              <Text style={styles.buttonText}>
                {isVirtualNumberActive ? "deactivate" : "activate"}
              </Text>
            </TouchableOpacity>

            <View style={styles.togglesContainer}>
              <View style={styles.toggleItem}>
                <Text style={[
                  styles.toggleLabel,
                  !isVirtualNumberActive && styles.disabledText
                ]}>Messages</Text>
                <Switch
                  value={isMessagesActive}
                  onValueChange={() => handleToggleMessages()}
                  trackColor={{ false: "#767577", true: "#4CAF50" }}
                  thumbColor="#FFFFFF"
                  disabled={!isVirtualNumberActive}
                  style={styles.largeSwitch}
                />
              </View>
              <View style={styles.toggleItem}>
                <Text style={[
                  styles.toggleLabel,
                  !isVirtualNumberActive && styles.disabledText
                ]}>Calls</Text>
                <Switch
                  value={deactivateCalls}
                  onValueChange={setDeactivateCalls}
                  trackColor={{ false: "#767577", true: "#4CAF50" }}
                  thumbColor="#FFFFFF"
                  disabled={!isVirtualNumberActive}
                  style={styles.largeSwitch}
                />
              </View>
            </View>
          </View>
        )}

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>messages</Text>
          <View style={styles.dividerLine} />
          {isAutoRefreshing && (
            <View style={styles.refreshIndicator}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          )}
        </View>

        <View style={styles.listContainer}>
          {messagesLoading ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.loadingIndicator} />
          ) : messages.length === 0 ? (
            <Text style={styles.noMessagesText}>No messages found</Text>
          ) : (
            messages.map((item) => (
              <TouchableOpacity
                key={item.id.toString()}
                style={styles.notificationItem}
                onPress={() => handleNotificationPress(item.id)}
              >
                <View style={styles.notificationHeader}>
                  {!item.is_read && (
                    <View style={styles.notificationContainer}>
                      <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                      <Text style={styles.notificationText}>New</Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.deleteMessageButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleMessageDeleteRequest(item.id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.senderText}>
                      from: {item.sender.toLowerCase()}
                    </Text>
                    <Text style={styles.timestampText}>
                      {formatTimestamp(item.received_at || item.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.messageText}>{item.message_body}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Custom Popup Notification */}
      {showPopup && (
        <Animated.View 
          style={[
            styles.popupContainer,
            popupMessage.includes("deactivated") ? styles.popupError : styles.popupSuccess,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.popupContent}>
            <Ionicons 
              name={popupMessage.includes("deactivated") ? "close-circle" : "checkmark-circle"} 
              size={24} 
              color="#fff" 
            />
            <Text style={styles.popupText}>{popupMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* Delete Number Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Delete Virtual Number</Text>
            <Text style={styles.modalMessage}>
              You are about to permanently delete this virtual number. Please note:
              {"\n\n"}
              • This action cannot be undone
              {"\n"}
              • All associated messages and call history will be permanently removed
              {"\n"}
              • Changes may take up to 24 hours to fully process
              {"\n\n"}
              Are you sure you want to proceed with deletion?
            </Text>
            {deleteLoading ? (
              <ActivityIndicator
                size="large"
                color="#FF3B30"
                style={styles.loadingIndicator}
              />
            ) : (
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCancelDelete}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleConfirmDelete}
                >
                  <Text style={styles.confirmButtonText}>Confirm Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Deactivate/Activate Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deactivateModalVisible}
        onRequestClose={handleCancelDeactivate}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {isVirtualNumberActive ? "Confirm Deactivate" : "Confirm Activate"}
            </Text>
            <Text style={styles.modalMessage}>
              {isVirtualNumberActive 
                ? "Deactivate this virtual number to stop receiving calls and messages but will not permanently delete the number."
                : "Activate this virtual number to start receiving calls and messages again."}
            </Text>
            {deactivateLoading ? (
              <ActivityIndicator
                size="large"
                color={isVirtualNumberActive ? "#FF3B30" : "#4CAF50"}
                style={styles.loadingIndicator}
              />
            ) : (
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCancelDeactivate}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton, 
                    isVirtualNumberActive ? styles.confirmButton : styles.activateButton
                  ]}
                  onPress={handleConfirmDeactivate}
                >
                  <Text style={styles.confirmButtonText}>
                    {isVirtualNumberActive ? "Deactivate" : "Activate"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Delete Message Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={messageDeleteModalVisible}
        onRequestClose={handleCancelMessageDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this message?
            </Text>
            {messageDeleteLoading ? (
              <ActivityIndicator
                size="large"
                color="#FF3B30"
                style={styles.loadingIndicator}
              />
            ) : (
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCancelMessageDelete}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleConfirmMessageDelete}
                >
                  <Text style={styles.confirmButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  androidSafeArea: {
    paddingTop: Platform.OS === 'android' ? 35 : 0
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
  },
  numberContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  headerNumber: {
    fontSize: 14,
    color: "#6c757d",
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
  helpButton: {
    padding: 4,
  },
  summaryCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statsBox: {
    flex: 1,
    alignItems: "center",
  },
  statsLabel: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
  },
  buttonsContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#dc3545",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deactivateButton: {
    backgroundColor: "black",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#fd7e14",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  togglesContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  toggleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  toggleItemLast: {
    borderBottomWidth: 0,
  },
  toggleLabel: {
    fontSize: 16,
    color: "#212529",
    fontWeight: "500",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    paddingHorizontal: 16,
    position: "relative",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e9ecef",
  },
  dividerText: {
    paddingHorizontal: 16,
    color: "#6c757d",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  refreshIndicator: {
    position: "absolute",
    right: 16,
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    minHeight: 100,
  },
  notificationItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  notificationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8d7da",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  notificationText: {
    color: "#721c24",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  senderText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6c757d",
  },
  timestampText: {
    fontSize: 14,
    color: "#6c757d",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#212529",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: "#212529",
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
    color: "#6c757d",
    lineHeight: 24,
  },
  deactivateOptions: {
    width: "100%",
    marginBottom: 16,
  },
  deactivateOption: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  deactivateOptionText: {
    fontSize: 16,
    color: "#212529",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  noMessagesText: {
    textAlign: "center",
    color: "#6c757d",
    fontSize: 16,
    marginTop: 20,
  },
  deleteMessageButton: {
    padding: 8,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  confirmButton: {
    backgroundColor: "#dc3545",
  },
  activateButton: {
    backgroundColor: "#28a745",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  popupContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  popupContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popupSuccess: {
    backgroundColor: '#4CAF50',
  },
  popupError: {
    backgroundColor: '#FF3B30',
  },
  popupText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
    flex: 1,
  },
  disabledText: {
    color: '#999',
    opacity: 0.7,
  },
  largeSwitch: {
    transform: [{ scaleX: 1.2 }],
  },
});

export default Ecommerce;