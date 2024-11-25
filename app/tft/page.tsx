'use client';

import { useState, useEffect } from 'react';
import {
  createTrackMeta, getTrackMetas, updateTrackMeta, deleteTrackMeta,
  createTrackItem, getTrackItems, updateTrackItem, deleteTrackItem,
} from '@/api/trackActions';
import { Button, Input, List, Typography, Form, Space } from 'antd';

const { Title } = Typography;

export default function Home() {
  const [trackMetas, setTrackMetas] = useState([]);
  const [trackItems, setTrackItems] = useState([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [remark, setRemark] = useState('');
  const [userId, setUserId] = useState('');
  const [editingTrackMetaId, setEditingTrackMetaId] = useState(null);
  const [editingTrackItemId, setEditingTrackItemId] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const metas = await getTrackMetas();
      const items = await getTrackItems();
      setTrackMetas(metas);
      setTrackItems(items);
    }
    fetchData();
  }, []);

  const handleCreateTrackMeta = async () => {
    const newTrackMeta = await createTrackMeta(name, type, remark, userId);
    setTrackMetas([...trackMetas, newTrackMeta]);
    setName('');
    setType('');
    setRemark('');
    setUserId('');
  };

  const handleUpdateTrackMeta = async () => {
    await updateTrackMeta(editingTrackMetaId, name, type, remark, userId);
    const updatedTrackMetas = trackMetas.map(meta => meta.id === editingTrackMetaId ? { ...meta, name, type, remark, userId } : meta);
    setTrackMetas(updatedTrackMetas);
    setEditingTrackMetaId(null);
    setName('');
    setType('');
    setRemark('');
    setUserId('');
  };

  const handleDeleteTrackMeta = async (id) => {
    await deleteTrackMeta(id);
    const updatedTrackMetas = trackMetas.filter(meta => meta.id !== id);
    setTrackMetas(updatedTrackMetas);
  };

  const handleCreateTrackItem = async () => {
    const newTrackItem = await createTrackItem(remark);
    setTrackItems([...trackItems, newTrackItem]);
    setRemark('');
  };

  const handleUpdateTrackItem = async () => {
    await updateTrackItem(editingTrackItemId, remark);
    const updatedTrackItems = trackItems.map(item => item.id === editingTrackItemId ? { ...item, remark } : item);
    setTrackItems(updatedTrackItems);
    setEditingTrackItemId(null);
    setRemark('');
  };

  const handleDeleteTrackItem = async (id) => {
    await deleteTrackItem(id);
    const updatedTrackItems = trackItems.filter(item => item.id !== id);
    setTrackItems(updatedTrackItems);
  };

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>Track Metas</Title>
      <List
        bordered
        dataSource={trackMetas}
        renderItem={meta => (
          <List.Item
            key={meta.id} // 添加 key 属性
            actions={[
              <Button type="link" onClick={() => { setEditingTrackMetaId(meta.id); setName(meta.name); setType(meta.type); setRemark(meta.remark); setUserId(meta.userId); }}>Edit</Button>,
              <Button type="link" danger onClick={() => handleDeleteTrackMeta(meta.id)}>Delete</Button>
            ]}
          >
            {meta.name} - {meta.type} - {meta.remark} - {meta.userId}
          </List.Item>
        )}
      />
      <Title level={3}>{editingTrackMetaId ? 'Edit Track Meta' : 'Create Track Meta'}</Title>
      <Form layout="vertical">
        <Form.Item label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Form.Item>
        <Form.Item label="Type">
          <Input value={type} onChange={(e) => setType(e.target.value)} />
        </Form.Item>
        <Form.Item label="Remark">
          <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Form.Item>
        <Form.Item label="User ID">
          <Input value={userId} onChange={(e) => setUserId(e.target.value)} />
        </Form.Item>
        <Form.Item>
          {editingTrackMetaId ? (
            <Button type="primary" onClick={handleUpdateTrackMeta}>Update Track Meta</Button>
          ) : (
            <Button type="primary" onClick={handleCreateTrackMeta}>Create Track Meta</Button>
          )}
        </Form.Item>
      </Form>

      <Title level={2}>Track Items</Title>
      <List
        bordered
        dataSource={trackItems}
        renderItem={item => (
          <List.Item
            key={item.id} // 添加 key 属性
            actions={[
              <Button type="link" onClick={() => { setEditingTrackItemId(item.id); setRemark(item.remark); }}>Edit</Button>,
              <Button type="link" danger onClick={() => handleDeleteTrackItem(item.id)}>Delete</Button>
            ]}
          >
            {item.remark}
          </List.Item>
        )}
      />
      <Title level={3}>{editingTrackItemId ? 'Edit Track Item' : 'Create Track Item'}</Title>
      <Form layout="vertical">
        <Form.Item label="Remark">
          <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Form.Item>
        <Form.Item>
          {editingTrackItemId ? (
            <Button type="primary" onClick={handleUpdateTrackItem}>Update Track Item</Button>
          ) : (
            <Button type="primary" onClick={handleCreateTrackItem}>Create Track Item</Button>
          )}
        </Form.Item>
      </Form>
    </div>
  );
}