import { Button, Col, Input, Row } from 'antd';
import React, { useState } from 'react';

const Login = (props) => {
  return (
    <div className="flex-center bg-[#f3f3f3] h-full">
      <div className="px-20 py-14 bg-white">
        <Row>
          <Col span={24}>UserName</Col>
        </Row>
        <Input className="mt-2 mb-4" />
        <Row>
          <Col span={24}>Password</Col>
        </Row>
        <Input.Password className="mt-2 mb-4" />
        <Button className=" bg-[#4096ff] w-full " type="primary">
          Submit
        </Button>
      </div>
    </div>
  );
};
export default Login;
