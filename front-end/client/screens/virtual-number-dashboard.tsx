import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  Clipboard,
  Modal,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "../api";

interface VirtualNumber {
  id: number;
  unread_count: number;
  numbers: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const VirtualNumberDashboard: React.FC = () => {
  const router = useRouter();
  const [virtualNumbers, setVirtualNumbers] = useState<VirtualNumber[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [locationModalVisible, setLocationModalVisible] = useState<boolean>(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState<boolean>(false);
  const [infoModalVisible, setInfoModalVisible] = useState<boolean>(false);
  const [recoveryModalVisible, setRecoveryModalVisible] = useState<boolean>(false);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [recoveryStatus, setRecoveryStatus] = useState<{
    success: boolean;
    message: string;
    restoredNumber?: string;
    messagesRestored?: number;
  }>({ success: false, message: "" });
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [processingSteps, setProcessingSteps] = useState<{ [key: string]: boolean }>({
    sendingRequest: false,
    backendValidation: false,
    sendingPhysical: false,
    requestingVirtual: false,
    sendingToTelecom: false,
    telecomLinks: false,
    storingLinkage: false,
    virtualReady: false,
  });
  const [locationDetected, setLocationDetected] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [infoAnim] = useState(new Animated.Value(0));

  const fetchVirtualNumbers = async () => {
    try {
      const response = await api.get("/virtual-numbers/");
      setVirtualNumbers(response.data);
    } catch (error) {
      console.error("Error fetching virtual numbers:", error);
      Alert.alert("Error", "Failed to load virtual numbers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVirtualNumbers();
    const refreshInterval = setInterval(() => {
      fetchVirtualNumbers();
    }, 2000);
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const toggleInfo = () => {
    if (showInfo) {
      Animated.timing(infoAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => setShowInfo(false));
    } else {
      setShowInfo(true);
      Animated.timing(infoAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  };

  const totalCount = virtualNumbers.length;
  const availableCount = totalCount >= 3 ? 0 : 3 - totalCount;

  const getNumbersByCategory = (category: string) => {
    return virtualNumbers.filter((num) => num.category === category);
  };

  const ecommerceNumbers = getNumbersByCategory("e-commerce");
  const socialMediaNumbers = getNumbersByCategory("social-media");
  const personalNumbers = getNumbersByCategory("personal");

  const getUnreadCount = (category: string): number => {
    const numbers = virtualNumbers.filter((num) => num.category === category);
    return numbers.reduce((total, num) => total + num.unread_count, 0);
  };

  const ecommerceUnreadCount = getUnreadCount("e-commerce");
  const socialMediaUnreadCount = getUnreadCount("social-media");
  const personalUnreadCount = getUnreadCount("personal");

  const getAvailableCategories = () => {
    const usedCategories = virtualNumbers.map((num) => num.category.toLowerCase());
    return ["e-commerce", "social-media", "personal"].filter(
      (category) => !usedCategories.includes(category.toLowerCase())
    );
  };

  const availableCategories = getAvailableCategories();

  const copyToClipboard = (number: string): void => {
    Clipboard.setString(number);
    Alert.alert("Copied", `${number} copied to clipboard`);
  };

  const handleRequestPress = () => {
    setLocationModalVisible(true);
    setLocationDetected(false);
    setTimeout(() => {
      setLocationDetected(true);
      setTimeout(() => {
        setLocationModalVisible(false);
        setCategoryModalVisible(true);
        if (availableCategories.length > 0) {
          setSelectedCategory(availableCategories[0]);
        }
      }, 1000);
    }, 2000);
  };

  const handleRecoverPress = async () => {
    setRecoveryModalVisible(true);
    setIsRecovering(true);
    
    // Simulate a delay to show the loading animation
    setTimeout(async () => {
      try {
        const response = await api.post("/restore-last-deleted-virtual-number/");
        setRecoveryStatus({
          success: true,
          message: response.data.message || "Virtual number restored successfully",
          restoredNumber: response.data.restored_number,
          messagesRestored: response.data.messages_restored
        });
        
        // Refresh virtual numbers after successful recovery
        setTimeout(() => {
          fetchVirtualNumbers();
        }, 1500);
      } catch (error: any) {
        // Don't log the error to console to avoid emulator issues
        setRecoveryStatus({
          success: false,
          message: error.response?.data?.message || "Failed to recover virtual number. Please try again later."
        });
      } finally {
        setIsRecovering(false);
      }
    }, 1500); // 1.5 second delay to show loading animation
  };

  const handleCategorySubmit = async () => {
    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    setCategoryModalVisible(false);
    setInfoModalVisible(true);

    const simulateProcessing = async () => {
      const steps = Object.keys(processingSteps);
      for (let i = 0; i < steps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 700));
        setProcessingSteps((prev) => ({ ...prev, [steps[i]]: true }));
      }

      try {
        await api.post("/create-virtual-number/", {
          geo_code: "IN",
          category: selectedCategory,
        });

        setTimeout(() => {
          setInfoModalVisible(false);
          fetchVirtualNumbers();
          setProcessingSteps({
            sendingRequest: false,
            backendValidation: false,
            sendingPhysical: false,
            requestingVirtual: false,
            sendingToTelecom: false,
            telecomLinks: false,
            storingLinkage: false,
            virtualReady: false,
          });
          setSelectedCategory("");
        }, 1500);
      } catch (error) {
        console.error("Error creating virtual number:", error);
        setInfoModalVisible(false);
        Alert.alert("Error", "Failed to create virtual number");
      }
    };

    simulateProcessing();
  };

  const formatCategoryName = (category: string) => {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const renderNumberContent = (category: string, numbers: VirtualNumber[]) => {
    const hasNumber = numbers.length > 0;
    const number = hasNumber ? numbers[0] : null;
    
    return (
      <>
        <View style={styles.tagContainer}>
          <Text style={styles.summaryTag}>{formatCategoryName(category).toUpperCase()}</Text>
        </View>
        {hasNumber ? (
          <View style={styles.numberRow}>
            <TouchableOpacity
              onPress={() => copyToClipboard(number!.numbers)}
              style={[
                styles.copyableNumber,
                !number!.is_active && styles.inactiveNumber,
              ]}
            >
              <Text 
                style={[
                  styles.summaryNumber,
                  !number!.is_active && styles.inactiveNumberText,
                ]}
              >
                {number!.numbers}
              </Text>
              <Ionicons
                name="copy-outline"
                size={14}
                color={number!.is_active ? "#666" : "#aaa"}
                style={styles.copyIcon}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.noNumberText}>No active virtual number</Text>
        )}
      </>
    );
  };

  const infoHeight = infoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180],
  });

  const infoOpacity = infoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Use Platform-specific container
  const Container = Platform.OS === 'ios' ? SafeAreaView : View;

  return (
    <Container style={[styles.safeArea, Platform.OS === 'android' && styles.androidSafeArea]}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/")}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Virtual numbers</Text>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCard}>
          {/* Top row: E-commerce and Social Media */}
          <View style={styles.summaryRow}>
            {/* E-commerce box */}
            <View style={styles.summaryBox}>
              {renderNumberContent("e-commerce", ecommerceNumbers)}
            </View>

            {/* Social media box */}
            <View style={styles.summaryBox}>
              {renderNumberContent("social-media", socialMediaNumbers)}
            </View>
          </View>

          {/* Bottom row: Personal */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryBox, styles.fullWidthBox]}>
              {renderNumberContent("personal", personalNumbers)}
            </View>
          </View>

          {/* Summary statistics */}
          <View style={styles.statsRow}>
            <View style={styles.statsBox}>
              <Text style={styles.statsLabel}>Total virtual numbers</Text>
              <Text style={styles.statsValue}>{totalCount}</Text>
            </View>
            <View style={styles.statsBox}>
              <Text style={styles.statsLabel}>Available numbers</Text>
              <Text style={styles.statsValue}>{availableCount}</Text>
            </View>
          </View>
        </View>

        {/* Request Button */}
        {availableCount > 0 && (
          <View style={styles.requestButtonContainer}>
            <TouchableOpacity
              style={styles.requestButton}
              onPress={handleRequestPress}
            >
              <Text style={styles.requestText}>Request New Number</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.recoverButton}
              onPress={handleRecoverPress}
            >
              <Text style={styles.recoverText}>Recover Last Deleted Number</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.infoButton}
              onPress={toggleInfo}
            >
              <Text style={styles.infoButtonText}>
                {showInfo ? 'Hide Info' : 'Info About Virtual Numbers'}
              </Text>
              <Ionicons 
                name={showInfo ? "chevron-up" : "chevron-down"} 
                size={18} 
                color="#4CAF50" 
              />
            </TouchableOpacity>

            {showInfo && (
              <Animated.View 
                style={[
                  styles.infoCard,
                  {
                    opacity: infoOpacity,
                    transform: [
                      {
                        translateY: infoAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 0],
                        }),
                      },
                      {
                        scale: infoAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.95, 1],
                        }),
                      }
                    ],
                  }
                ]}
              >
                <View style={styles.infoHeader}>
                  <Ionicons name="information-circle" size={20} color="#4CAF50" />
                  <Text style={styles.infoTitle}>About Virtual Numbers</Text>
                </View>
                <View style={styles.infoContent}>
                  <View style={styles.infoItem}>
                    <Ionicons name="time-outline" size={16} color="#6c757d" style={styles.infoIcon} />
                    <Text style={styles.infoText}>Numbers take up to 24 hours to activate</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="shield-checkmark-outline" size={16} color="#6c757d" style={styles.infoIcon} />
                    <Text style={styles.infoText}>Temporary number linked to your real number</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="lock-closed-outline" size={16} color="#6c757d" style={styles.infoIcon} />
                    <Text style={styles.infoText}>Receive SMS/calls without exposing your personal number</Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </View>
        )}

        {/* Show message when there are no virtual numbers */}
        {totalCount === 0 && (
          <View style={styles.noNumbersContainer}>
            <Ionicons name="phone-portrait-outline" size={48} color="#ccc" />
            <Text style={styles.noNumbersText}>No virtual numbers yet</Text>
            <Text style={styles.noNumbersSubText}>
              Request a virtual number to get started
            </Text>
          </View>
        )}

        {/* Manage Divider - Only show if there are numbers */}
        {totalCount > 0 && (
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>manage</Text>
            <View style={styles.dividerLine} />
          </View>
        )}

        {/* Only show manage cards for categories that have numbers */}
        {ecommerceNumbers.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push("/e-commerce")}
            style={styles.manageCard}
          >
            <View style={styles.manageContent}>
              <View style={styles.manageHeader}>
                <View style={styles.categoryTitleRow}>
                  <Ionicons name="cart-outline" size={20} color="#4CAF50" style={styles.categoryIcon} />
                  <Text style={styles.manageTitle}>E-commerce</Text>
                </View>
                <View style={styles.manageNumberRow}>
                  <Text 
                    style={[
                      styles.manageNumber,
                      !ecommerceNumbers[0].is_active && styles.inactiveManageNumber
                    ]}
                  >
                    {ecommerceNumbers[0].numbers}
                  </Text>
                  {!ecommerceNumbers[0].is_active && (
                    <View style={styles.manageInactiveStatus}>
                      <Ionicons name="time-outline" size={14} color="#FF9800" />
                      <Text style={styles.manageInactiveText}>Not active</Text>
                    </View>
                  )}
                </View>
              </View>
              {ecommerceNumbers[0].unread_count > 0 && (
                <View style={styles.notificationContainer}>
                  <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                  <Text style={styles.notificationText}>
                    {ecommerceNumbers[0].unread_count} new notifications
                  </Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={22} color="#000" />
          </TouchableOpacity>
        )}

        {socialMediaNumbers.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push("/social")}
            style={styles.manageCard}
          >
            <View style={styles.manageContent}>
              <View style={styles.manageHeader}>
                <View style={styles.categoryTitleRow}>
                  <Ionicons name="share-social-outline" size={20} color="#2196F3" style={styles.categoryIcon} />
                  <Text style={styles.manageTitle}>Social Media</Text>
                </View>
                <View style={styles.manageNumberRow}>
                  <Text 
                    style={[
                      styles.manageNumber,
                      !socialMediaNumbers[0].is_active && styles.inactiveManageNumber
                    ]}
                  >
                    {socialMediaNumbers[0].numbers}
                  </Text>
                  {!socialMediaNumbers[0].is_active && (
                    <View style={styles.manageInactiveStatus}>
                      <Ionicons name="time-outline" size={14} color="#FF9800" />
                      <Text style={styles.manageInactiveText}>Not active</Text>
                    </View>
                  )}
                </View>
              </View>
              {socialMediaNumbers[0].unread_count > 0 && (
                <View style={styles.notificationContainer}>
                  <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                  <Text style={styles.notificationText}>
                    {socialMediaNumbers[0].unread_count} new notifications
                  </Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={22} color="#000" />
          </TouchableOpacity>
        )}

        {personalNumbers.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push("/personal")}
            style={styles.manageCard}
          >
            <View style={styles.manageContent}>
              <View style={styles.manageHeader}>
                <View style={styles.categoryTitleRow}>
                  <Ionicons name="person-outline" size={20} color="#9C27B0" style={styles.categoryIcon} />
                  <Text style={styles.manageTitle}>Personal</Text>
                </View>
                <View style={styles.manageNumberRow}>
                  <Text 
                    style={[
                      styles.manageNumber,
                      !personalNumbers[0].is_active && styles.inactiveManageNumber
                    ]}
                  >
                    {personalNumbers[0].numbers}
                  </Text>
                  {!personalNumbers[0].is_active && (
                    <View style={styles.manageInactiveStatus}>
                      <Ionicons name="time-outline" size={14} color="#FF9800" />
                      <Text style={styles.manageInactiveText}>Not active</Text>
                    </View>
                  )}
                </View>
              </View>
              {personalNumbers[0].unread_count > 0 && (
                <View style={styles.notificationContainer}>
                  <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                  <Text style={styles.notificationText}>
                    {personalNumbers[0].unread_count} new notifications
                  </Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={22} color="#000" />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Location Detection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={locationModalVisible}
      >
        <TouchableWithoutFeedback
          onPress={() => setLocationModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Detecting location...</Text>
                <ActivityIndicator
                  size="large"
                  color="#4CAF50"
                  style={styles.spinner}
                />
                {locationDetected && (
                  <>
                    <Text style={styles.locationText}>
                      Location detected: INDIA
                    </Text>
                    <Text style={styles.locationSubText}>
                      You can generate virtual numbers for India
                    </Text>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Category Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={categoryModalVisible}
      >
        <TouchableWithoutFeedback
          onPress={() => setCategoryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Create a virtual number</Text>

                <View style={styles.categoryButtonsContainer}>
                  {availableCategories.length > 0 ? (
                    availableCategories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryButton,
                          selectedCategory === category &&
                            styles.selectedCategoryButton,
                        ]}
                        onPress={() => setSelectedCategory(category)}
                      >
                        <Text
                          style={[
                            styles.categoryButtonText,
                            selectedCategory === category &&
                              styles.selectedCategoryButtonText,
                          ]}
                        >
                          {formatCategoryName(category)}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.noCategoriesContainer}>
                      <Ionicons name="warning" size={24} color="#FFA500" />
                      <Text style={styles.noCategoriesText}>
                        No categories available. You've reached the maximum of 3
                        numbers.
                      </Text>
                    </View>
                  )}
                </View>

                {availableCategories.length > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      !selectedCategory && styles.disabledButton,
                    ]}
                    onPress={handleCategorySubmit}
                    disabled={!selectedCategory}
                  >
                    <Text style={styles.requestText}>create</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Recovery Status Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={recoveryModalVisible}
      >
        <TouchableWithoutFeedback
          onPress={() => setRecoveryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                {isRecovering ? (
                  <>
                    <Text style={styles.modalTitle}>Recovering Virtual Number</Text>
                    <Text style={styles.recoveryInfoText}>
                      Only the most recently deleted virtual number can be recovered.
                    </Text>
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#4CAF50" />
                      <Text style={styles.loadingText}>Please wait while we recover your virtual number...</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.modalTitle}>
                      {recoveryStatus.success ? "Recovery Successful" : "Recovery Failed"}
                    </Text>
                    
                    <Text style={styles.recoveryInfoText}>
                      Only the most recently deleted virtual number can be recovered.
                    </Text>
                    
                    {recoveryStatus.success ? (
                      <>
                        <View style={styles.recoverySuccessContainer}>
                          <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
                          <Text style={styles.recoveryMessage}>{recoveryStatus.message}</Text>
                          
                          {recoveryStatus.restoredNumber && (
                            <View style={styles.restoredNumberContainer}>
                              <Text style={styles.restoredNumberLabel}>Restored Number:</Text>
                              <Text style={styles.restoredNumberValue}>{recoveryStatus.restoredNumber}</Text>
                            </View>
                          )}
                          
                          {recoveryStatus.messagesRestored !== undefined && (
                            <Text style={styles.messagesRestoredText}>
                              {recoveryStatus.messagesRestored} messages restored
                            </Text>
                          )}
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.recoveryErrorContainer}>
                          <Ionicons name="alert-circle" size={50} color="#FF3B30" />
                          <Text style={styles.recoveryErrorMessage}>{recoveryStatus.message}</Text>
                        </View>
                      </>
                    )}
                    
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => setRecoveryModalVisible(false)}
                    >
                      <Text style={styles.requestText}>close</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Info/Processing Modal */}
      <Modal animationType="fade" transparent={true} visible={infoModalVisible}>
        <TouchableWithoutFeedback
          onPress={() => {
            if (!Object.values(processingSteps).every((step) => step)) {
              return;
            }
            setInfoModalVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.infoModalContainer}>
                <Text style={styles.modalTitle}>Processing your request</Text>

                <View style={styles.processingSteps}>
                  <View style={styles.processingStep}>
                    <Ionicons
                      name={
                        processingSteps.sendingRequest
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={18}
                      color={
                        processingSteps.sendingRequest ? "#4CAF50" : "#ccc"
                      }
                    />
                    <Text style={styles.processingText}>
                      Sending virtual number creation request to backend
                    </Text>
                  </View>

                  <View style={styles.processingStep}>
                    <Ionicons
                      name={
                        processingSteps.backendValidation
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={18}
                      color={
                        processingSteps.backendValidation ? "#4CAF50" : "#ccc"
                      }
                    />
                    <Text style={styles.processingText}>
                      Backend receives and validates user input
                    </Text>
                  </View>

                  <View style={styles.processingStep}>
                    <Ionicons
                      name={
                        processingSteps.sendingPhysical
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={18}
                      color={
                        processingSteps.sendingPhysical ? "#4CAF50" : "#ccc"
                      }
                    />
                    <Text style={styles.processingText}>
                      Sending physical (actual) number and selected category to
                      backend
                    </Text>
                  </View>

                  <View style={styles.processingStep}>
                    <Ionicons
                      name={
                        processingSteps.requestingVirtual
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={18}
                      color={
                        processingSteps.requestingVirtual ? "#4CAF50" : "#ccc"
                      }
                    />
                    <Text style={styles.processingText}>
                      Backend requests virtual number from Telecom API
                    </Text>
                  </View>

                  <View style={styles.processingStep}>
                    <Ionicons
                      name={
                        processingSteps.sendingToTelecom
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={18}
                      color={
                        processingSteps.sendingToTelecom ? "#4CAF50" : "#ccc"
                      }
                    />
                    <Text style={styles.processingText}>
                      Sending actual number + generated virtual number to
                      Telecom API for mapping
                    </Text>
                  </View>

                  <View style={styles.processingStep}>
                    <Ionicons
                      name={
                        processingSteps.telecomLinks
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={18}
                      color={processingSteps.telecomLinks ? "#4CAF50" : "#ccc"}
                    />
                    <Text style={styles.processingText}>
                      Telecom API links numbers and sends back confirmation
                    </Text>
                  </View>

                  <View style={styles.processingStep}>
                    <Ionicons
                      name={
                        processingSteps.storingLinkage
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={18}
                      color={
                        processingSteps.storingLinkage ? "#4CAF50" : "#ccc"
                      }
                    />
                    <Text style={styles.processingText}>
                      Backend stores linkage and activates the virtual number
                    </Text>
                  </View>

                  <View style={styles.processingStep}>
                    <Ionicons
                      name={
                        processingSteps.virtualReady
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={18}
                      color={processingSteps.virtualReady ? "#4CAF50" : "#ccc"}
                    />
                    <Text style={styles.processingText}>
                      Virtual number is now live and ready for use
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryBox: {
    width: "48%",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: 'center',
    minHeight: 100,
  },
  fullWidthBox: {
    width: "100%",
  },
  tagContainer: {
    marginBottom: 8,
  },
  summaryTag: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1a936f",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  noNumberText: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: 'center',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyableNumber: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#e9ecef",
  },
  inactiveNumber: {
    backgroundColor: "#f0f0f0",

  },
  summaryNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
  },
  inactiveNumberText: {
    color: "#6c757d",
    opacity:0.8,
    fontStyle:"italic"
  },
  copyIcon: {
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    paddingTop: 16,
    marginTop: 8,
  },
  statsBox: {
    flex: 1,
    alignItems: "center",
  },
  statsLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
  },
  requestButtonContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  requestButton: {
    backgroundColor: "#28a745",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  recoverButton: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  recoverText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 12,
  },
  infoButtonText: {
    color: "#36454F",
    fontWeight: "600",
    fontSize: 14,
    marginRight: 8,
  },
  infoCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    overflow: 'hidden',
    height: 180,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginLeft: 8,
  },
  infoContent: {
    paddingLeft: 4,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#495057",
    flex: 1,
    lineHeight: 20,
  },
  requestText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  noNumbersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  noNumbersText: {
    fontSize: 18,
    color: "#212529",
    marginTop: 16,
    fontWeight: '600',
  },
  noNumbersSubText: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 8,
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    paddingHorizontal: 16,
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
  manageCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  manageContent: {
    flex: 1,
  },
  manageHeader: {
    // marginBottom removed for better alignment
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom removed for better alignment
  },
  categoryIcon: {
    marginRight: 8,
  },
  manageTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
  },
  manageNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
    marginLeft: 28, // 24 (icon width) + 4 (icon margin)
  },
  manageNumber: {
    fontSize: 14,
    color: "#495057",
  },
  inactiveManageNumber: {
    color: "#adb5bd",
  },
  manageInactiveStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    backgroundColor: "#fff3cd",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  manageInactiveText: {
    fontSize: 12,
    color: "#e0a800",
    marginLeft: 4,
    fontWeight: "500",
  },
  notificationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8d7da",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  notificationText: {
    color: "#721c24",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  spinner: {
    marginVertical: 20,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 8,
  },
  locationSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  categoryButtonsContainer: {
    marginVertical: 20,
  },
  categoryButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedCategoryButton: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  categoryButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
  selectedCategoryButtonText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  modalButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  noCategoriesContainer: {
    alignItems: "center",
    padding: 20,
  },
  noCategoriesText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
  infoModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  processingSteps: {
    marginTop: 16,
  },
  processingStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  processingText: {
    fontSize: 14,
    color: "#444",
    marginLeft: 8,
    flex: 1,
  },
  recoverySuccessContainer: {
    alignItems: "center",
    padding: 20,
  },
  recoveryMessage: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  restoredNumberContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    marginBottom: 16,
  },
  restoredNumberLabel: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 4,
  },
  restoredNumberValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
  },
  messagesRestoredText: {
    fontSize: 14,
    color: "#6c757d",
    fontStyle: "italic",
  },
  recoveryErrorContainer: {
    alignItems: "center",
    padding: 20,
  },
  recoveryErrorMessage: {
    fontSize: 16,
    color: "#dc3545",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
  },
  recoveryInfoText: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 16,
    fontStyle: "italic",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#4CAF50",
    textAlign: "center",
  },
});

export default VirtualNumberDashboard;