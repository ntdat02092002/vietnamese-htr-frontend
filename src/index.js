import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Stage, Layer, Image, Rect, Group, Text, Circle } from "react-konva";
import useImage from 'use-image';

const MAX_IMAGE_HEIGHT = 600;
const MAX_IMAGE_WIDTH = 1110;
var keys = 1

const cropImage = async (imageRef, x, y, width, height) => {
    const dataURL = imageRef.current.toDataURL({
        pixelRatio: 3,
        x: x, // Tọa độ x của vùng cắt
        y: y, // Tọa độ y của vùng cắt
        width: width, // Chiều rộng của vùng cắt
        height: height, // Chiều cao của vùng cắt
    });

    // Gửi dữ liệu ảnh đã cắt đến API
    const apiHost = process.env.REACT_APP_API_HOST;
    const apiPort = process.env.REACT_APP_API_PORT;
    const apiUrl = `${apiHost}:${apiPort}/predict`;
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: dataURL }),
    });

    const result = await response.json();
    const label = result.text;;
    // console.log(dataURL);
    // await sleep(2000).then(() => {
    //     console.log('End');
    // });

    return label;
};

const LoadImage = ({ src, imageWidth, imageHeight, setImageWidth, setImageHeight, ratioWidth, ratioHeight, imageRef }) => {
    const [image] = useImage(src);
    useEffect(() => {
        if (image?.complete) {
            const width = image.naturalWidth;
            const height = image.naturalHeight;

            if (width > height && width > MAX_IMAGE_WIDTH) {
                setImageWidth(MAX_IMAGE_WIDTH);
                setImageHeight(height * (MAX_IMAGE_WIDTH / width))
                ratioHeight(MAX_IMAGE_WIDTH / width)
                ratioWidth((MAX_IMAGE_WIDTH / width))
            }
            else if (height > width && height > MAX_IMAGE_HEIGHT) {
                setImageHeight(MAX_IMAGE_HEIGHT);
                setImageWidth(width * (MAX_IMAGE_HEIGHT / height))
                ratioWidth(MAX_IMAGE_HEIGHT / height)
                ratioHeight((MAX_IMAGE_HEIGHT / height))
            }
            else {
                setImageWidth(width)
                setImageHeight(height)
            }

            // setGetImage(image);

        }
    }, [image]);

    return (<Image image={image} width={imageWidth} height={imageHeight} ref={imageRef} />)
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const DrawAnnotations = () => {
    const [annotations, setAnnotations] = useState([]);
    const [newAnnotation, setNewAnnotation] = useState([]);
    const [imageSrc, setImageSrc] = useState("");
    const [imageWidth, setImageWidth] = useState(0);
    const [imageHeight, setImageHeight] = useState(0);
    const [getImage, setGetImage] = useState([]);
    const [bboxInfo, setBboxInfo] = useState([]);
    const [ratio_w, ratioWidth] = useState(1)
    const [ratio_h, ratioHeight] = useState(1)
    const [base64, setBase64Image] = useState(null)

    const imageRef = useRef();
    const deleteRef = useRef();

    // const previewCanvasRef = useRef < HTMLCanvasElement > (null);

    const handleMouseDown = event => {
        if (newAnnotation.length === 0) {
            const { x, y } = event.target.getStage().getPointerPosition();
            setNewAnnotation([{ x, y, width: 0, height: 0, key: "0", label: "", src: null }]);
        }
    };

    const handleMouseUp = event => {
        if (newAnnotation.length === 1) {
            const sx = newAnnotation[0].x;
            const sy = newAnnotation[0].y;
            const { x, y } = event.target.getStage().getPointerPosition();

            if (x - sx > 10 && y - sy > 5) {
                const annotationToAdd = {
                    x: sx,
                    y: sy,
                    width: x - sx,
                    height: y - sy,
                    key: keys,
                    label: '', // label rỗng
                    src: imageRef.current.toDataURL({
                        pixelRatio: 3,
                        x: sx, // Tọa độ x của vùng cắt
                        y: sy, // Tọa độ y của vùng cắt
                        width: x - sx, // Chiều rộng của vùng cắt
                        height: y - sy,
                    })
                };
                keys += 1;

                setNewAnnotation([]);

                // annotations.push(annotationToAdd);
                // setAnnotations([...annotations]); 


                setAnnotations(prevAnnotations => [...prevAnnotations, annotationToAdd]);

                // Gọi hàm cropImage và cập nhật label của annotation sau khi hoàn thành
                cropImage(imageRef, sx, sy, x - sx, y - sy).then(label => {
                    setAnnotations(prevAnnotations =>
                        prevAnnotations.map(annotation =>
                            annotation.key === annotationToAdd.key
                                ? { ...annotation, label: label } // Cập nhật label của annotation
                                : annotation // Giữ nguyên annotation
                        )
                    );
                });

            }
            else {
                setNewAnnotation([]);
            }

        }

    };



    const handleMouseMove = event => {
        if (newAnnotation.length === 1) {
            const sx = newAnnotation[0].x;
            const sy = newAnnotation[0].y;
            const { x, y } = event.target.getStage().getPointerPosition();
            setNewAnnotation([
                {
                    x: sx,
                    y: sy,
                    width: x - sx,
                    height: y - sy,
                    key: "0",
                    label: "",
                    src: ""
                }
            ]);

        }
    };

    const annotationsToDraw = [...annotations, ...newAnnotation];
    return (
        <div className="row">
            <div className="col-9 p-1">
                {<ImageUploader setAnnotations={setAnnotations} setNewAnnotation={setNewAnnotation} setImageSrc={setImageSrc} setGetImage={setGetImage} />}
                <Stage
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    width={imageWidth}
                    height={imageHeight}
                    style={{ marginLeft: '14px', justifyContent: 'center', border: 'solid 1px #333' }}
                >
                    <Layer >
                        {/* <div> */}
                        <Group x={0} y={0} width={MAX_IMAGE_WIDTH} height={MAX_IMAGE_HEIGHT} style={{ border: 'solid 1px #333' }} draggable={false}>
                            {imageSrc && <LoadImage src={imageSrc} imageWidth={imageWidth} imageHeight={imageHeight} setImageWidth={setImageWidth} setImageHeight={setImageHeight} ratioWidth={ratioWidth} ratioHeight={ratioHeight} imageRef={imageRef} />}
                        </Group>
                        {annotationsToDraw.map(value => {
                            return (
                                <div>
                                    <Rect
                                        x={value.x}
                                        y={value.y}
                                        width={value.width}
                                        height={value.height}
                                        fill="transparent"
                                        stroke="red"
                                    />
                                    <Text
                                        text={value.label}
                                        fontSize={13}
                                        fill='green'
                                        x={value.x}
                                        y={value.y - 10}
                                    />
                                </div>


                            );
                        })}
                        {annotations.map(value => {
                            return (
                                <div>
                                    <svg>
                                        <Circle
                                            x={value.width + value.x}
                                            y={value.y}
                                            key={value.key}
                                            radius={5}
                                            fill="blue"
                                            onClick={() => {
                                                setAnnotations(annotations.filter(annotation => annotation.key !== value.key));
                                                // if (deleteRef.current) {
                                                //     deleteRef.current.remove()
                                                // } 
                                            }}
                                            ref={deleteRef}
                                        />
                                    </svg>
                                </div>
                            )
                        })}

                    </Layer>
                </Stage>
            </div>
            {/* <div className="col-3 shadow mb-1 bg-white rounded" style={{ display: 'block' }}>
                <h4 className="col-12 text-secondary" style={{ marginRight: '24px' }}>Danh sách ảnh đã cắt</h4>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {annotations.map((value, index) => {
                        return (
                            <div>

                                <li key={index} style={{ display: 'flex', alignItems: 'center', boxShadow: '0px 0px 5px 2px rgba(0,0,0,0.1)', marginBottom: '10px', padding: '10px' }}>
                                    <img height={value.height} width={value.width} src={value.src} style={{ boxShadow: '0px 0px 5px 2px rgba(0,0,0,0.1)', marginRight: '10px' }}></img>
                                    <h5>{value.label}</h5>
                                </li>
                                
                            </div>
                        );
                    })}
                </ul>
            </div> */}

            <div className="col-3 shadow mb-1 bg-white rounded" style={{ display: 'block', maxHeight: '100vh', overflow: 'auto' }}>
                <h4 className="col-12 text-secondary" style={{ marginRight: '24px', marginTop: '12px', marginBottom: '12px' }}>Danh sách ảnh đã cắt</h4>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {annotations.map((value, index) => {
                        return (
                            <div>
                                <li key={index} style={{ display: 'flex', alignItems: 'center', boxShadow: '0px 0px 5px 2px rgba(0,0,0,0.1)', marginBottom: '10px', padding: '10px' }}>
                                    <img height={value.height} width={value.width} src={value.src} style={{ boxShadow: '0px 0px 5px 2px rgba(0,0,0,0.1)', marginRight: '10px' }}></img>
                                    <h5>{value.label}</h5>
                                </li>
                                {index !== annotations.length - 1 && <hr style={{ width: '100%', marginTop: '10px' }} />}
                            </div>

                        );
                    })}
                </ul>
            </div>


        </div>

    );
};
export const ImageUploader = ({ setAnnotations, setNewAnnotation, setImageSrc, setGetImage }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    // const [selectedImageName, setSelectedImageName] = useState('');


    const handleImageChange = (event) => {
        const file = event.target.files[0];
        // const name = file.name;

        if (file) {
            setImageSrc(URL.createObjectURL(file))

            setAnnotations([])
            setNewAnnotation([])

            const reader = new FileReader();

            reader.onloadend = () => {
                // setSelectedImage(reader.result);
                setGetImage(reader.result);
                // Konva.Image.fromURL(reader.result, setGetImage, console.error);
                // setSelectedImageName(file.name);
                // imageSrc(reader.result); imageName(name);
                // onImageChange({ src: reader.result, name: file.name });
            };

            reader.readAsDataURL(file);
        }
    };

    // const handleImageUpload = () => {
    //   // Đây là nơi để thực hiện các hành động cần thiết sau khi ảnh đã được tải lên

    // };

    return (
        <div className="col-12 shadow mb-1 p-1 bg-white rounded">
            <div className="row" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <h4 className="col-2 text-secondary" style={{ marginRight: '24px' }}> Upload Image</h4>
                <div className="col-2" style={{ position: 'relative', display: 'inline-block' }}>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} id="fileInput" />
                    <label htmlFor="fileInput" style={{ padding: '8px 16px', backgroundColor: '#808080', color: 'white', cursor: 'pointer', borderRadius: '5px' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'pink'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#808080'}>
                        Choose File
                    </label>
                </div>
            </div>

        </div>
    );
};

function App() {
    return (
        <div>
            <DrawAnnotations />
        </div>
    );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<DrawAnnotations />, rootElement);
