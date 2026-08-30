// /components/layout/AdminLayout.js
"use client"
import React, { useState } from 'react';
import '@ant-design/v5-patch-for-react-19';
import { Layout, theme } from 'antd';
import HeaderAdmin from '@/components/common/HeaderAdmin';
import MenuAdmin from '@/components/common/MenuAdmin';
const { Header, Content, Footer, Sider } = Layout;

const siderStyle = {
  overflow: 'auto',
  height: '100vh',
  position: 'sticky',
  insetInlineStart: 0,
  top: 0,
  bottom: 0,
  scrollbarWidth: 'thin',
  scrollbarGutter: 'stable',
};

export default function MainLayout({ children }) {

  const [collapsed, setCollapsed] = useState(false);

  const { token: { colorBgContainer, borderRadiusLG },} = theme.useToken();
  
  return (
   
    <Layout style={{ maxHeight: '100dvh', overflow:"scroll" }}>
  
      <Sider style={siderStyle} collapsed={collapsed} onCollapse={value => setCollapsed(value)}>

        <MenuAdmin />
        
      </Sider>

      <Layout>

        <Header style={{ position:"sticky", width:"100%", padding: 0, background: colorBgContainer, zIndex:"10", top:0 }} >

          <HeaderAdmin collapsed={collapsed} setCollapsed={setCollapsed}/>
        
        </Header>

        <Content style={{ margin: '16px 16px'}}>

          <div
            style={{
              padding: 24,
              minHeight: "100%",
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >

            {children}
          
          </div>
          
        </Content>
      
      </Layout>

    </Layout>

  );
}
