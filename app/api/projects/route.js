import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';

export async function GET() {
  await connectDB();
  const projects = await Project.find({}).sort({ createdAt: -1 });
  return NextResponse.json(projects);
}

export async function POST(request) {
  await connectDB();
  const body = await request.json();
  const { name, url, pingInterval, notifyTelegram, notifyEmail } = body;

  if (!name || !url) {
    return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
  }

  const interval = Math.max(5, parseInt(pingInterval) || 10);

  try {
    const newProject = await Project.create({
      name,
      url,
      pingInterval: interval,
      notifyTelegram: notifyTelegram || false,
      notifyEmail: notifyEmail || false,
    });
    return NextResponse.json(newProject, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Duplicate entry or invalid data' }, { status: 400 });
  }
}

export async function PUT(request) {
  await connectDB();
  const body = await request.json();
  const { id, notifyTelegram, notifyEmail, pingInterval } = body;

  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  const updatedProject = await Project.findByIdAndUpdate(
    id,
    { notifyTelegram, notifyEmail, pingInterval },
    { new: true }
  );

  return NextResponse.json(updatedProject);
}

export async function DELETE(request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  await Project.findByIdAndDelete(id);
  return NextResponse.json({ message: 'Deleted successfully' });
}