import React, { useState, useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Sidebar from "../dashboard/Sidebar";
import Header from "../dashboard/Header";
import { baseStyles, colors } from "../../styles/theme";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isMobile = screenWidth < 768;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  return (
    <View style={[baseStyles.container, styles.appLayout]}>
      <Sidebar 
        isMobile={isMobile}
        isVisible={isMobile ? mobileMenuVisible : true}
        onClose={() => setMobileMenuVisible(false)}
      />
      
      <View style={styles.mainContent}>
        <Header onMenuPress={() => setMobileMenuVisible(true)} />
        <View style={styles.contentContainer}>
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  appLayout: {
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flex: 1,
  },
});

export default AppLayout;