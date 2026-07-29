"use client";

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';

const Scene = dynamic(() => import('@/components/Three/Scene'), {
  ssr: false,
});

export default function SceneWrapper() {
  return <Scene />;
}
